"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const engine_service_1 = require("../engine/engine.service");
const games_service_1 = require("../games/games.service");
const auth_service_1 = require("../auth/auth.service");
const cache_service_1 = require("../cache/cache.service");
const RECONNECT_TIMEOUT_MS = 2 * 60 * 1000;
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    constructor(engineService, gamesService, authService, cacheService, jwtService, configService) {
        this.engineService = engineService;
        this.gamesService = gamesService;
        this.authService = authService;
        this.cacheService = cacheService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(WebsocketGateway_1.name);
        this.socketUsers = new Map();
        this.socketRooms = new Map();
        this.disconnectTimers = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const user = this.socketUsers.get(client.id);
        const rooms = this.socketRooms.get(client.id);
        this.socketUsers.delete(client.id);
        this.socketRooms.delete(client.id);
        if (!user || !rooms)
            return;
        for (const room of rooms) {
            if (room.startsWith('game:')) {
                const gameId = room.replace('game:', '');
                const timerKey = `${gameId}:${user.userId}`;
                const existing = this.disconnectTimers.get(timerKey);
                if (existing)
                    clearTimeout(existing);
                const timer = setTimeout(() => {
                    this.disconnectTimers.delete(timerKey);
                    this.server.to(room).emit('game:player:disconnected', {
                        userId: user.userId,
                    });
                    this.cacheService
                        .removePlayerConnection(gameId, user.userId)
                        .catch(() => { });
                    this.logger.log(`Player ${user.username} (${user.userId}) timed out from game ${gameId}`);
                }, RECONNECT_TIMEOUT_MS);
                this.disconnectTimers.set(timerKey, timer);
            }
            if (room.startsWith('lobby:')) {
                this.emitLobbyUpdate(room).catch(() => { });
            }
        }
    }
    async authenticateClient(token) {
        try {
            const secret = this.configService.get('JWT_SECRET');
            const payload = this.jwtService.verify(token, { secret });
            const user = await this.authService.validateUser(payload.sub);
            if (!user)
                return null;
            return { userId: user.id, username: user.username };
        }
        catch (error) {
            this.logger.warn(`Token verification failed: ${error}`);
            return null;
        }
    }
    getUserFromSocket(client) {
        return this.socketUsers.get(client.id) ?? null;
    }
    trackRoom(socketId, room) {
        let rooms = this.socketRooms.get(socketId);
        if (!rooms) {
            rooms = new Set();
            this.socketRooms.set(socketId, rooms);
        }
        rooms.add(room);
    }
    untrackRoom(socketId, room) {
        const rooms = this.socketRooms.get(socketId);
        if (rooms) {
            rooms.delete(room);
        }
    }
    async handleLobbyJoin(client, data) {
        try {
            if (!data?.code || !data?.token) {
                client.emit('game:error', { message: 'Missing code or token' });
                return;
            }
            const user = await this.authenticateClient(data.token);
            if (!user) {
                client.emit('game:error', { message: 'Authentication failed' });
                return;
            }
            this.socketUsers.set(client.id, user);
            const game = await this.gamesService.getGameByCode(data.code);
            const room = `lobby:${game.id}`;
            client.join(room);
            this.trackRoom(client.id, room);
            await this.cacheService.setPlayerConnection(game.id, user.userId, client.id);
            this.logger.log(`Player ${user.username} joined lobby ${data.code} (game ${game.id})`);
            await this.emitLobbyUpdate(room, game.id);
        }
        catch (error) {
            this.logger.error(`Error in lobby:join: ${error}`);
            client.emit('game:error', {
                message: 'Failed to join lobby',
            });
        }
    }
    async handleLobbyLeave(client, data) {
        try {
            if (!data?.code) {
                client.emit('game:error', { message: 'Missing lobby code' });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const game = await this.gamesService.getGameByCode(data.code);
            const room = `lobby:${game.id}`;
            client.leave(room);
            this.untrackRoom(client.id, room);
            await this.cacheService.removePlayerConnection(game.id, user.userId);
            this.logger.log(`Player ${user.username} left lobby ${data.code}`);
            await this.emitLobbyUpdate(room, game.id);
        }
        catch (error) {
            this.logger.error(`Error in lobby:leave: ${error}`);
            client.emit('game:error', { message: 'Failed to leave lobby' });
        }
    }
    async handleLobbyChat(client, data) {
        try {
            if (!data?.code || !data?.message) {
                client.emit('game:error', { message: 'Missing code or message' });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const message = data.message.trim();
            if (message.length === 0 || message.length > 500) {
                client.emit('game:error', {
                    message: 'Message must be between 1 and 500 characters',
                });
                return;
            }
            const game = await this.gamesService.getGameByCode(data.code);
            const room = `lobby:${game.id}`;
            this.server.to(room).emit('lobby:chat:message', {
                userId: user.userId,
                username: user.username,
                message,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`Error in lobby:chat: ${error}`);
            client.emit('game:error', { message: 'Failed to send message' });
        }
    }
    async handleGameStart(client, data) {
        try {
            if (!data?.gameId) {
                client.emit('game:error', { message: 'Missing gameId' });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const isHost = await this.gamesService.isHost(data.gameId, user.userId);
            if (!isHost) {
                client.emit('game:error', {
                    message: 'Only the host can start the game',
                });
                return;
            }
            const game = await this.gamesService.getGame(data.gameId);
            const minPlayers = game.scenario?.minPlayers ?? 3;
            if (game.players.length < minPlayers) {
                client.emit('game:error', {
                    message: `Need at least ${minPlayers} players to start`,
                });
                return;
            }
            const gameState = await this.engineService.initializeGame(data.gameId);
            await this.cacheService.setGameState(data.gameId, gameState);
            await this.gamesService.updateGameStatus(data.gameId, 'IN_PROGRESS');
            const lobbyRoom = `lobby:${data.gameId}`;
            const gameRoom = `game:${data.gameId}`;
            const lobbySockets = await this.server.in(lobbyRoom).fetchSockets();
            for (const socket of lobbySockets) {
                socket.leave(lobbyRoom);
                socket.join(gameRoom);
                this.untrackRoom(socket.id, lobbyRoom);
                this.trackRoom(socket.id, gameRoom);
            }
            this.server.to(gameRoom).emit('lobby:started', { gameId: data.gameId });
            this.logger.log(`Game ${data.gameId} started by ${user.username}`);
            const narration = await this.engineService.startNarration(data.gameId);
            this.server.to(gameRoom).emit('game:phase', {
                phase: 'NARRATION',
                round: 1,
            });
            this.server.to(gameRoom).emit('game:narration', {
                text: narration.text,
                isStreaming: false,
            });
        }
        catch (error) {
            this.logger.error(`Error in game:start: ${error}`);
            client.emit('game:error', { message: 'Failed to start game' });
        }
    }
    async handleGameJoin(client, data) {
        try {
            if (!data?.gameId || !data?.token) {
                client.emit('game:error', { message: 'Missing gameId or token' });
                return;
            }
            const user = await this.authenticateClient(data.token);
            if (!user) {
                client.emit('game:error', { message: 'Authentication failed' });
                return;
            }
            this.socketUsers.set(client.id, user);
            const gameRoom = `game:${data.gameId}`;
            client.join(gameRoom);
            this.trackRoom(client.id, gameRoom);
            await this.cacheService.setPlayerConnection(data.gameId, user.userId, client.id);
            const timerKey = `${data.gameId}:${user.userId}`;
            const existingTimer = this.disconnectTimers.get(timerKey);
            if (existingTimer) {
                clearTimeout(existingTimer);
                this.disconnectTimers.delete(timerKey);
                this.server.to(gameRoom).emit('game:player:reconnected', {
                    userId: user.userId,
                });
                this.logger.log(`Player ${user.username} reconnected to game ${data.gameId}`);
            }
            else {
                this.server.to(gameRoom).emit('game:player:joined', {
                    userId: user.userId,
                    username: user.username,
                });
                this.logger.log(`Player ${user.username} joined game ${data.gameId}`);
            }
            const gameState = await this.cacheService.getGameState(data.gameId);
            if (gameState) {
                client.emit('game:state', gameState);
                if (gameState.currentPhase === 'ACTION') {
                    this.engineService
                        .getPredefinedActions(data.gameId)
                        .then(async (predefined) => {
                        client.emit('game:action:suggestions', {
                            predefined,
                            aiSuggestions: [],
                            loading: true,
                        });
                        try {
                            const aiSuggestions = await this.engineService.getActionSuggestions(data.gameId, user.userId);
                            client.emit('game:action:suggestions', {
                                predefined,
                                aiSuggestions,
                                loading: false,
                            });
                        }
                        catch {
                            client.emit('game:action:suggestions', {
                                predefined,
                                aiSuggestions: [],
                                loading: false,
                            });
                        }
                    })
                        .catch((err) => this.logger.error(`Error sending suggestions on join: ${err}`));
                }
            }
        }
        catch (error) {
            this.logger.error(`Error in game:join: ${error}`);
            client.emit('game:error', { message: 'Failed to join game' });
        }
    }
    async handleGameLeave(client, data) {
        try {
            if (!data?.gameId) {
                client.emit('game:error', { message: 'Missing gameId' });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const gameRoom = `game:${data.gameId}`;
            client.leave(gameRoom);
            this.untrackRoom(client.id, gameRoom);
            await this.cacheService.removePlayerConnection(data.gameId, user.userId);
            const timerKey = `${data.gameId}:${user.userId}`;
            const timer = this.disconnectTimers.get(timerKey);
            if (timer) {
                clearTimeout(timer);
                this.disconnectTimers.delete(timerKey);
            }
            this.server.to(gameRoom).emit('game:player:left', {
                userId: user.userId,
            });
            this.logger.log(`Player ${user.username} left game ${data.gameId}`);
        }
        catch (error) {
            this.logger.error(`Error in game:leave: ${error}`);
            client.emit('game:error', { message: 'Failed to leave game' });
        }
    }
    async handleGameAction(client, data) {
        try {
            if (!data?.gameId || !data?.action) {
                client.emit('game:error', { message: 'Missing gameId or action' });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const gameRoom = `game:${data.gameId}`;
            const result = await this.engineService.submitAction(data.gameId, user.userId, data.action);
            this.server.to(gameRoom).emit('game:action:received', {
                userId: user.userId,
                remaining: result.remaining,
            });
            this.logger.log(`Action received from ${user.username} in game ${data.gameId}. Remaining: ${result.remaining}`);
            if (result.allActed) {
                await this.handleAllActionsSubmitted(data.gameId, gameRoom);
            }
        }
        catch (error) {
            this.logger.error(`Error in game:action: ${error}`);
            client.emit('game:error', { message: 'Failed to submit action' });
        }
    }
    async handleGameVote(client, data) {
        try {
            if (!data?.gameId || !data?.targetId) {
                client.emit('game:error', {
                    message: 'Missing gameId or targetId',
                });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const gameRoom = `game:${data.gameId}`;
            const result = await this.engineService.submitVote(data.gameId, user.userId, data.targetId);
            this.server.to(gameRoom).emit('game:vote:received', {
                userId: user.userId,
                remaining: result.remaining,
            });
            this.logger.log(`Vote received from ${user.username} in game ${data.gameId}. Remaining: ${result.remaining}`);
            if (result.allVoted) {
                await this.handleAllVotesSubmitted(data.gameId, gameRoom);
            }
        }
        catch (error) {
            this.logger.error(`Error in game:vote: ${error}`);
            client.emit('game:error', { message: 'Failed to submit vote' });
        }
    }
    async handleGameChat(client, data) {
        try {
            if (!data?.gameId || !data?.message) {
                client.emit('game:error', { message: 'Missing gameId or message' });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const message = data.message.trim();
            if (message.length === 0 || message.length > 500) {
                client.emit('game:error', {
                    message: 'Message must be between 1 and 500 characters',
                });
                return;
            }
            const gameRoom = `game:${data.gameId}`;
            const timestamp = new Date().toISOString();
            await this.gamesService.saveMessage(data.gameId, user.userId, message, 'CHAT');
            this.server.to(gameRoom).emit('game:chat:message', {
                userId: user.userId,
                username: user.username,
                message,
                timestamp,
            });
        }
        catch (error) {
            this.logger.error(`Error in game:chat: ${error}`);
            client.emit('game:error', { message: 'Failed to send message' });
        }
    }
    async handleAdvancePhase(client, data) {
        try {
            if (!data?.gameId) {
                client.emit('game:error', { message: 'Missing gameId' });
                return;
            }
            const user = this.getUserFromSocket(client);
            if (!user) {
                client.emit('game:error', { message: 'Not authenticated' });
                return;
            }
            const isHost = await this.gamesService.isHost(data.gameId, user.userId);
            if (!isHost) {
                client.emit('game:error', {
                    message: 'Only the host can advance the phase',
                });
                return;
            }
            const state = await this.engineService.advancePhase(data.gameId);
            const gameRoom = `game:${data.gameId}`;
            this.server.to(gameRoom).emit('game:phase', {
                phase: state.currentPhase,
                round: state.currentRound,
            });
            if (state.currentPhase === 'ACTION') {
                this.sendActionSuggestions(data.gameId, gameRoom).catch((err) => this.logger.error(`Error sending action suggestions: ${err}`));
            }
            this.logger.log(`Game ${data.gameId} phase advanced to ${state.currentPhase} by host ${user.username}`);
        }
        catch (error) {
            this.logger.error(`Error in game:advance: ${error}`);
            client.emit('game:error', { message: 'Failed to advance phase' });
        }
    }
    async handleAllActionsSubmitted(gameId, gameRoom) {
        try {
            const gameState = await this.cacheService.getGameState(gameId);
            this.server.to(gameRoom).emit('game:phase', {
                phase: 'VOTE',
                round: gameState?.currentRound ?? 1,
            });
            this.logger.log(`Game ${gameId} advanced to VOTE phase`);
        }
        catch (error) {
            this.logger.error(`Error handling all actions submitted for game ${gameId}: ${error}`);
            this.server.to(gameRoom).emit('game:error', {
                message: 'Error advancing game phase',
            });
        }
    }
    async handleAllVotesSubmitted(gameId, gameRoom) {
        try {
            await this.resolveAndAdvance(gameId, gameRoom);
        }
        catch (error) {
            this.logger.error(`Error handling all votes submitted for game ${gameId}: ${error}`);
            this.server.to(gameRoom).emit('game:error', {
                message: 'Error resolving round',
            });
        }
    }
    async resolveAndAdvance(gameId, gameRoom) {
        const resolution = await this.engineService.resolveRound(gameId);
        this.server.to(gameRoom).emit('game:resolution', {
            narrative: resolution.narrative,
            eliminations: resolution.eliminations,
            gaugeChanges: resolution.gaugeChanges,
        });
        const gameState = await this.cacheService.getGameState(gameId);
        this.server.to(gameRoom).emit('game:phase', {
            phase: 'RESOLUTION',
            round: gameState?.currentRound ?? 1,
        });
        this.logger.log(`Game ${gameId} round resolved`);
        if (resolution.isGameOver && resolution.gameResult) {
            this.server.to(gameRoom).emit('game:over', {
                result: resolution.gameResult.result,
                epilogue: resolution.gameResult.epilogue,
                scores: resolution.gameResult.scores,
            });
            await this.gamesService.updateGameStatus(gameId, 'FINISHED');
            await this.cacheService.deleteGameState(gameId);
            this.logger.log(`Game ${gameId} finished: ${resolution.gameResult.result}`);
        }
        else {
            setTimeout(async () => {
                try {
                    const narration = await this.engineService.startNarration(gameId);
                    this.server.to(gameRoom).emit('game:phase', {
                        phase: 'NARRATION',
                        round: narration.round,
                    });
                    this.server.to(gameRoom).emit('game:narration', {
                        text: narration.text,
                        isStreaming: false,
                    });
                    this.logger.log(`Game ${gameId} started narration for round ${narration.round}`);
                }
                catch (error) {
                    this.logger.error(`Error starting next narration for game ${gameId}: ${error}`);
                    this.server.to(gameRoom).emit('game:error', {
                        message: 'Error starting next round',
                    });
                }
            }, 5000);
        }
    }
    async sendActionSuggestions(gameId, gameRoom) {
        try {
            const predefined = await this.engineService.getPredefinedActions(gameId);
            const sockets = await this.server.in(gameRoom).fetchSockets();
            for (const socket of sockets) {
                socket.emit('game:action:suggestions', {
                    predefined,
                    aiSuggestions: [],
                    loading: true,
                });
            }
            const gameState = await this.cacheService.getGameState(gameId);
            if (!gameState)
                return;
            const alivePlayers = gameState.players.filter((p) => p.isAlive);
            const suggestionPromises = alivePlayers.map(async (player) => {
                try {
                    const suggestions = await this.engineService.getActionSuggestions(gameId, player.userId);
                    return { userId: player.userId, suggestions };
                }
                catch (err) {
                    this.logger.warn(`Failed to get AI suggestions for ${player.userId}: ${err}`);
                    return { userId: player.userId, suggestions: [] };
                }
            });
            const results = await Promise.all(suggestionPromises);
            for (const socket of sockets) {
                const socketUser = this.socketUsers.get(socket.id);
                if (!socketUser)
                    continue;
                const playerResult = results.find((r) => r.userId === socketUser.userId);
                socket.emit('game:action:suggestions', {
                    predefined,
                    aiSuggestions: playerResult?.suggestions ?? [],
                    loading: false,
                });
            }
        }
        catch (error) {
            this.logger.error(`Error sending action suggestions for game ${gameId}: ${error}`);
            this.server.to(gameRoom).emit('game:action:suggestions', {
                predefined: [],
                aiSuggestions: [],
                loading: false,
            });
        }
    }
    async emitLobbyUpdate(room, gameId) {
        try {
            const id = gameId ?? room.replace('lobby:', '');
            const game = await this.gamesService.getGame(id);
            const players = game.players.map((p) => ({
                userId: p.user.id,
                username: p.user.username,
                avatar: p.user.avatar,
                isHost: p.isHost,
            }));
            this.server.to(room).emit('lobby:update', {
                players,
                playerCount: players.length,
                maxPlayers: game.maxPlayers,
            });
        }
        catch (error) {
            this.logger.error(`Error emitting lobby update: ${error}`);
        }
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('lobby:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleLobbyJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('lobby:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleLobbyLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('lobby:chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleLobbyChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleGameStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleGameJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleGameLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:action'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleGameAction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:vote'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleGameVote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleGameChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:advance'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleAdvancePhase", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/game',
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [engine_service_1.EngineService,
        games_service_1.GamesService,
        auth_service_1.AuthService,
        cache_service_1.CacheService,
        jwt_1.JwtService,
        config_1.ConfigService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map