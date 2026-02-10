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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scenarios_service_1 = require("../scenarios/scenarios.service");
let GamesService = class GamesService {
    constructor(prisma, scenariosService) {
        this.prisma = prisma;
        this.scenariosService = scenariosService;
    }
    async createGame(userId, dto) {
        if (!this.scenariosService.scenarioExists(dto.scenarioSlug)) {
            throw new common_1.NotFoundException(`Scenario "${dto.scenarioSlug}" not found`);
        }
        const scenario = this.scenariosService.getScenario(dto.scenarioSlug);
        const code = await this.generateUniqueCode();
        const game = await this.prisma.game.create({
            data: {
                code,
                scenarioSlug: dto.scenarioSlug,
                status: 'LOBBY',
                currentPhase: 'WAITING',
                currentRound: 0,
                maxRounds: scenario.maxRounds,
                maxPlayers: dto.maxPlayers ?? 6,
                turnTimeout: dto.turnTimeout ?? 60,
                isPrivate: dto.isPrivate ?? false,
                hostId: userId,
                players: {
                    create: {
                        userId,
                        isHost: true,
                    },
                },
            },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        return game;
    }
    async joinGame(userId, code) {
        const game = await this.prisma.game.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        if (!game) {
            throw new common_1.NotFoundException(`Game with code "${code}" not found`);
        }
        if (game.status !== 'LOBBY') {
            throw new common_1.BadRequestException('Game is not in lobby status');
        }
        if (game.players.length >= game.maxPlayers) {
            throw new common_1.BadRequestException('Game is full');
        }
        const alreadyJoined = game.players.some((p) => p.userId === userId);
        if (alreadyJoined) {
            throw new common_1.BadRequestException('You have already joined this game');
        }
        await this.prisma.gamePlayer.create({
            data: {
                gameId: game.id,
                userId,
            },
        });
        return this.getGame(game.id);
    }
    async leaveGame(userId, gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: true },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        const player = game.players.find((p) => p.userId === userId);
        if (!player) {
            throw new common_1.BadRequestException('You are not in this game');
        }
        await this.prisma.gamePlayer.delete({
            where: { id: player.id },
        });
        const remainingPlayers = game.players.filter((p) => p.userId !== userId);
        if (remainingPlayers.length === 0) {
            await this.prisma.game.update({
                where: { id: gameId },
                data: { status: 'CANCELLED' },
            });
            return { message: 'Game cancelled (no players remaining)' };
        }
        if (player.isHost) {
            const newHost = remainingPlayers[0];
            await this.prisma.$transaction([
                this.prisma.gamePlayer.update({
                    where: { id: newHost.id },
                    data: { isHost: true },
                }),
                this.prisma.game.update({
                    where: { id: gameId },
                    data: { hostId: newHost.userId },
                }),
            ]);
        }
        return this.getGame(gameId);
    }
    async getGame(gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
                events: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        const scenario = this.scenariosService.scenarioExists(game.scenarioSlug)
            ? this.scenariosService.getScenario(game.scenarioSlug)
            : null;
        return {
            ...game,
            scenario: scenario
                ? {
                    name: scenario.name,
                    description: scenario.description,
                    minPlayers: scenario.minPlayers,
                    maxPlayers: scenario.maxPlayers,
                    duration: scenario.duration,
                    difficulty: scenario.difficulty,
                }
                : null,
        };
    }
    async getGameByCode(code) {
        const game = await this.prisma.game.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!game) {
            throw new common_1.NotFoundException(`Game with code "${code}" not found`);
        }
        return this.getGame(game.id);
    }
    async listPublicGames() {
        const games = await this.prisma.game.findMany({
            where: {
                status: 'LOBBY',
                isPrivate: false,
            },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return games.map((game) => ({
            ...game,
            playerCount: game.players.length,
        }));
    }
    async getUserGames(userId) {
        const gamePlayers = await this.prisma.gamePlayer.findMany({
            where: { userId },
            include: {
                game: {
                    include: {
                        players: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
            take: 20,
        });
        return gamePlayers.map((gp) => ({
            ...gp.game,
            playerCount: gp.game.players.length,
            myRole: gp.role,
        }));
    }
    async updateGameStatus(gameId, status) {
        const updateData = { status };
        if (status === 'IN_PROGRESS') {
            updateData.startedAt = new Date();
        }
        if (status === 'FINISHED' || status === 'CANCELLED') {
            updateData.finishedAt = new Date();
        }
        return this.prisma.game.update({
            where: { id: gameId },
            data: updateData,
        });
    }
    async saveGameState(gameId, state) {
        return this.prisma.game.update({
            where: { id: gameId },
            data: { stateSnapshot: state },
        });
    }
    async addGameEvent(gameId, eventData) {
        return this.prisma.gameEvent.create({
            data: {
                gameId,
                round: eventData.round,
                phase: eventData.phase,
                type: eventData.type,
                actorId: eventData.actorId,
                data: eventData.data,
                narrative: eventData.narrative,
            },
        });
    }
    async getGameEvents(gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        return this.prisma.gameEvent.findMany({
            where: { gameId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async endGame(gameId, results) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: true },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.game.update({
                where: { id: gameId },
                data: {
                    status: 'FINISHED',
                    finishedAt: new Date(),
                },
            });
            if (results.scores) {
                for (const player of game.players) {
                    const score = results.scores[player.userId];
                    if (score !== undefined) {
                        await tx.gamePlayer.update({
                            where: { id: player.id },
                            data: { score },
                        });
                    }
                }
            }
            for (const player of game.players) {
                const isWinner = results.winnerIds.includes(player.userId);
                await tx.userStats.updateMany({
                    where: { userId: player.userId },
                    data: {
                        gamesPlayed: { increment: 1 },
                        ...(isWinner ? { gamesWon: { increment: 1 } } : {}),
                    },
                });
            }
        });
        return this.getGame(gameId);
    }
    async isHost(gameId, userId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            select: { hostId: true },
        });
        return game?.hostId === userId;
    }
    async saveMessage(gameId, userId, content, type = 'CHAT') {
        return this.prisma.message.create({
            data: {
                gameId,
                userId,
                content,
                type,
            },
        });
    }
    async getPlayerList(gameId) {
        return this.prisma.gamePlayer.findMany({
            where: { gameId },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true },
                },
            },
        });
    }
    async generateUniqueCode() {
        let code;
        let exists = true;
        while (exists) {
            code = this.generateGameCode();
            const existing = await this.prisma.game.findUnique({
                where: { code },
            });
            exists = !!existing;
        }
        return code;
    }
    generateGameCode() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scenarios_service_1.ScenariosService])
], GamesService);
//# sourceMappingURL=games.service.js.map