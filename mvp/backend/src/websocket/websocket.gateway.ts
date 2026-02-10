import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EngineService } from '../engine/engine.service';
import { GamesService } from '../games/games.service';
import { AuthService } from '../auth/auth.service';
import { CacheService } from '../cache/cache.service';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketUserData,
} from './websocket.types';

/** Timeout (ms) before a disconnected player is marked as gone. */
const RECONNECT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/game',
  transports: ['websocket', 'polling'],
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  /**
   * Map of socketId -> { userId, username } for connected clients.
   * Populated on successful authentication.
   */
  private readonly socketUsers = new Map<string, SocketUserData>();

  /**
   * Map of socketId -> Set<roomName> so we know which rooms a socket was in
   * when it disconnects.
   */
  private readonly socketRooms = new Map<string, Set<string>>();

  /**
   * Disconnect timers keyed by `gameId:userId`.
   * When the timer fires the player is broadcast as disconnected.
   */
  private readonly disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly engineService: EngineService,
    private readonly gamesService: GamesService,
    private readonly authService: AuthService,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ===========================================================================
  // Lifecycle hooks
  // ===========================================================================

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);

    const user = this.socketUsers.get(client.id);
    const rooms = this.socketRooms.get(client.id);

    // Clean up maps
    this.socketUsers.delete(client.id);
    this.socketRooms.delete(client.id);

    if (!user || !rooms) return;

    // For each game room the player was in, start a reconnection timeout
    for (const room of rooms) {
      if (room.startsWith('game:')) {
        const gameId = room.replace('game:', '');
        const timerKey = `${gameId}:${user.userId}`;

        // Clear any existing timer for this user/game
        const existing = this.disconnectTimers.get(timerKey);
        if (existing) clearTimeout(existing);

        // Start a new timer — after RECONNECT_TIMEOUT_MS, notify other players
        const timer = setTimeout(() => {
          this.disconnectTimers.delete(timerKey);
          this.server.to(room).emit('game:player:disconnected', {
            userId: user.userId,
          });
          // Remove cached connection
          this.cacheService
            .removePlayerConnection(gameId, user.userId)
            .catch(() => {});
          this.logger.log(
            `Player ${user.username} (${user.userId}) timed out from game ${gameId}`,
          );
        }, RECONNECT_TIMEOUT_MS);

        this.disconnectTimers.set(timerKey, timer);
      }

      if (room.startsWith('lobby:')) {
        // For lobby rooms, immediately emit an update
        this.emitLobbyUpdate(room).catch(() => {});
      }
    }
  }

  // ===========================================================================
  // Authentication helpers
  // ===========================================================================

  /**
   * Verify a JWT token and return the user data, or null if invalid.
   */
  private async authenticateClient(
    token: string,
  ): Promise<SocketUserData | null> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      const user = await this.authService.validateUser(payload.sub);
      if (!user) return null;
      return { userId: user.id, username: user.username };
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error}`);
      return null;
    }
  }

  /**
   * Get cached user data for a connected socket.
   */
  private getUserFromSocket(client: Socket): SocketUserData | null {
    return this.socketUsers.get(client.id) ?? null;
  }

  /**
   * Track that a socket has joined a room.
   */
  private trackRoom(socketId: string, room: string): void {
    let rooms = this.socketRooms.get(socketId);
    if (!rooms) {
      rooms = new Set();
      this.socketRooms.set(socketId, rooms);
    }
    rooms.add(room);
  }

  /**
   * Remove a room from the socket's tracked rooms.
   */
  private untrackRoom(socketId: string, room: string): void {
    const rooms = this.socketRooms.get(socketId);
    if (rooms) {
      rooms.delete(room);
    }
  }

  // ===========================================================================
  // Lobby events
  // ===========================================================================

  @SubscribeMessage('lobby:join')
  async handleLobbyJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string; token: string },
  ): Promise<void> {
    try {
      if (!data?.code || !data?.token) {
        client.emit('game:error', { message: 'Missing code or token' });
        return;
      }

      // Authenticate
      const user = await this.authenticateClient(data.token);
      if (!user) {
        client.emit('game:error', { message: 'Authentication failed' });
        return;
      }

      // Store user data on socket
      this.socketUsers.set(client.id, user);

      // Find the game by code
      const game = await this.gamesService.getGameByCode(data.code);
      const room = `lobby:${game.id}`;

      // Join the socket room
      client.join(room);
      this.trackRoom(client.id, room);

      // Cache the player connection
      await this.cacheService.setPlayerConnection(
        game.id,
        user.userId,
        client.id,
      );

      this.logger.log(
        `Player ${user.username} joined lobby ${data.code} (game ${game.id})`,
      );

      // Emit lobby update to all players in the room
      await this.emitLobbyUpdate(room, game.id);
    } catch (error) {
      this.logger.error(`Error in lobby:join: ${error}`);
      client.emit('game:error', {
        message: 'Failed to join lobby',
      });
    }
  }

  @SubscribeMessage('lobby:leave')
  async handleLobbyLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string },
  ): Promise<void> {
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

      // Leave the socket room
      client.leave(room);
      this.untrackRoom(client.id, room);

      // Remove cached connection
      await this.cacheService.removePlayerConnection(game.id, user.userId);

      this.logger.log(
        `Player ${user.username} left lobby ${data.code}`,
      );

      // Emit updated lobby to remaining players
      await this.emitLobbyUpdate(room, game.id);
    } catch (error) {
      this.logger.error(`Error in lobby:leave: ${error}`);
      client.emit('game:error', { message: 'Failed to leave lobby' });
    }
  }

  @SubscribeMessage('lobby:chat')
  async handleLobbyChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string; message: string },
  ): Promise<void> {
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

      // Validate message
      const message = data.message.trim();
      if (message.length === 0 || message.length > 500) {
        client.emit('game:error', {
          message: 'Message must be between 1 and 500 characters',
        });
        return;
      }

      const game = await this.gamesService.getGameByCode(data.code);
      const room = `lobby:${game.id}`;

      // Emit chat message to all in the lobby room
      this.server.to(room).emit('lobby:chat:message', {
        userId: user.userId,
        username: user.username,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error in lobby:chat: ${error}`);
      client.emit('game:error', { message: 'Failed to send message' });
    }
  }

  // ===========================================================================
  // Game lifecycle events
  // ===========================================================================

  @SubscribeMessage('game:start')
  async handleGameStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): Promise<void> {
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

      // Verify user is the host
      const isHost = await this.gamesService.isHost(data.gameId, user.userId);
      if (!isHost) {
        client.emit('game:error', {
          message: 'Only the host can start the game',
        });
        return;
      }

      // Get game details and verify minimum players
      const game = await this.gamesService.getGame(data.gameId);
      const minPlayers = game.scenario?.minPlayers ?? 3;

      if (game.players.length < minPlayers) {
        client.emit('game:error', {
          message: `Need at least ${minPlayers} players to start`,
        });
        return;
      }

      // Initialize the game engine state
      const gameState = await this.engineService.initializeGame(data.gameId);

      // Cache the initial state
      await this.cacheService.setGameState(data.gameId, gameState);

      // Update game status in DB
      await this.gamesService.updateGameStatus(data.gameId, 'IN_PROGRESS');

      const lobbyRoom = `lobby:${data.gameId}`;
      const gameRoom = `game:${data.gameId}`;

      // Move all lobby sockets to the game room
      const lobbySockets = await this.server.in(lobbyRoom).fetchSockets();
      for (const socket of lobbySockets) {
        socket.leave(lobbyRoom);
        socket.join(gameRoom);
        // Update room tracking
        this.untrackRoom(socket.id, lobbyRoom);
        this.trackRoom(socket.id, gameRoom);
      }

      // Notify all clients that the game has started
      this.server.to(gameRoom).emit('lobby:started', { gameId: data.gameId });

      this.logger.log(`Game ${data.gameId} started by ${user.username}`);

      // Start narration phase
      const narration = await this.engineService.startNarration(data.gameId);

      // Emit narration to game room
      this.server.to(gameRoom).emit('game:narration', {
        text: narration.text,
        isStreaming: false,
      });

      // Emit phase update
      this.server.to(gameRoom).emit('game:phase', {
        phase: 'NARRATION',
        round: 1,
      });
    } catch (error) {
      this.logger.error(`Error in game:start: ${error}`);
      client.emit('game:error', { message: 'Failed to start game' });
    }
  }

  @SubscribeMessage('game:join')
  async handleGameJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; token: string },
  ): Promise<void> {
    try {
      if (!data?.gameId || !data?.token) {
        client.emit('game:error', { message: 'Missing gameId or token' });
        return;
      }

      // Authenticate
      const user = await this.authenticateClient(data.token);
      if (!user) {
        client.emit('game:error', { message: 'Authentication failed' });
        return;
      }

      // Store user data
      this.socketUsers.set(client.id, user);

      const gameRoom = `game:${data.gameId}`;

      // Join the game room
      client.join(gameRoom);
      this.trackRoom(client.id, gameRoom);

      // Cache the connection
      await this.cacheService.setPlayerConnection(
        data.gameId,
        user.userId,
        client.id,
      );

      // Check if this is a reconnection (cancel disconnect timer)
      const timerKey = `${data.gameId}:${user.userId}`;
      const existingTimer = this.disconnectTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.disconnectTimers.delete(timerKey);

        // Notify other players of reconnection
        this.server.to(gameRoom).emit('game:player:reconnected', {
          userId: user.userId,
        });

        this.logger.log(
          `Player ${user.username} reconnected to game ${data.gameId}`,
        );
      } else {
        // Notify other players of a new join
        this.server.to(gameRoom).emit('game:player:joined', {
          userId: user.userId,
          username: user.username,
        });

        this.logger.log(
          `Player ${user.username} joined game ${data.gameId}`,
        );
      }

      // Send current game state to the joining/reconnecting client
      const gameState = await this.cacheService.getGameState(data.gameId);
      if (gameState) {
        client.emit('game:state', gameState);
      }
    } catch (error) {
      this.logger.error(`Error in game:join: ${error}`);
      client.emit('game:error', { message: 'Failed to join game' });
    }
  }

  @SubscribeMessage('game:leave')
  async handleGameLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): Promise<void> {
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

      // Leave the socket room
      client.leave(gameRoom);
      this.untrackRoom(client.id, gameRoom);

      // Remove cached connection
      await this.cacheService.removePlayerConnection(
        data.gameId,
        user.userId,
      );

      // Clear any disconnect timer
      const timerKey = `${data.gameId}:${user.userId}`;
      const timer = this.disconnectTimers.get(timerKey);
      if (timer) {
        clearTimeout(timer);
        this.disconnectTimers.delete(timerKey);
      }

      // Notify remaining players
      this.server.to(gameRoom).emit('game:player:left', {
        userId: user.userId,
      });

      this.logger.log(
        `Player ${user.username} left game ${data.gameId}`,
      );
    } catch (error) {
      this.logger.error(`Error in game:leave: ${error}`);
      client.emit('game:error', { message: 'Failed to leave game' });
    }
  }

  // ===========================================================================
  // Game action events
  // ===========================================================================

  @SubscribeMessage('game:action')
  async handleGameAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; action: string },
  ): Promise<void> {
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

      // Submit the action to the engine
      const result = await this.engineService.submitAction(
        data.gameId,
        user.userId,
        data.action,
      );

      // Notify room that action was received
      this.server.to(gameRoom).emit('game:action:received', {
        userId: user.userId,
        remaining: result.remaining,
      });

      this.logger.log(
        `Action received from ${user.username} in game ${data.gameId}. Remaining: ${result.remaining}`,
      );

      // If all players have acted, auto-advance
      if (result.allActed) {
        await this.handleAllActionsSubmitted(data.gameId, gameRoom);
      }
    } catch (error) {
      this.logger.error(`Error in game:action: ${error}`);
      client.emit('game:error', { message: 'Failed to submit action' });
    }
  }

  @SubscribeMessage('game:vote')
  async handleGameVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; targetId: string },
  ): Promise<void> {
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

      // Submit the vote to the engine
      const result = await this.engineService.submitVote(
        data.gameId,
        user.userId,
        data.targetId,
      );

      // Notify room that vote was received
      this.server.to(gameRoom).emit('game:vote:received', {
        userId: user.userId,
        remaining: result.remaining,
      });

      this.logger.log(
        `Vote received from ${user.username} in game ${data.gameId}. Remaining: ${result.remaining}`,
      );

      // If all players have voted, resolve the round
      if (result.allVoted) {
        await this.handleAllVotesSubmitted(data.gameId, gameRoom);
      }
    } catch (error) {
      this.logger.error(`Error in game:vote: ${error}`);
      client.emit('game:error', { message: 'Failed to submit vote' });
    }
  }

  // ===========================================================================
  // Game chat
  // ===========================================================================

  @SubscribeMessage('game:chat')
  async handleGameChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; message: string },
  ): Promise<void> {
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

      // Validate message
      const message = data.message.trim();
      if (message.length === 0 || message.length > 500) {
        client.emit('game:error', {
          message: 'Message must be between 1 and 500 characters',
        });
        return;
      }

      const gameRoom = `game:${data.gameId}`;
      const timestamp = new Date().toISOString();

      // Save message to DB
      await this.gamesService.saveMessage(
        data.gameId,
        user.userId,
        message,
        'CHAT',
      );

      // Broadcast to game room
      this.server.to(gameRoom).emit('game:chat:message', {
        userId: user.userId,
        username: user.username,
        message,
        timestamp,
      });
    } catch (error) {
      this.logger.error(`Error in game:chat: ${error}`);
      client.emit('game:error', { message: 'Failed to send message' });
    }
  }

  // ===========================================================================
  // Phase advance (host-triggered)
  // ===========================================================================

  @SubscribeMessage('game:advance')
  async handleAdvancePhase(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ): Promise<void> {
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

      // Only the host can advance the phase
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

      this.logger.log(
        `Game ${data.gameId} phase advanced to ${state.currentPhase} by host ${user.username}`,
      );
    } catch (error) {
      this.logger.error(`Error in game:advance: ${error}`);
      client.emit('game:error', { message: 'Failed to advance phase' });
    }
  }

  // ===========================================================================
  // Phase transition helpers
  // ===========================================================================

  /**
   * Called when all alive players have submitted actions.
   * Determines whether to go to VOTE phase or directly resolve.
   */
  private async handleAllActionsSubmitted(
    gameId: string,
    gameRoom: string,
  ): Promise<void> {
    try {
      const gameState = await this.cacheService.getGameState(gameId);
      // The engine already advanced to VOTE phase in submitAction,
      // so we just need to notify clients.
      this.server.to(gameRoom).emit('game:phase', {
        phase: 'VOTE',
        round: gameState?.currentRound ?? 1,
      });
      this.logger.log(`Game ${gameId} advanced to VOTE phase`);
    } catch (error) {
      this.logger.error(
        `Error handling all actions submitted for game ${gameId}: ${error}`,
      );
      this.server.to(gameRoom).emit('game:error', {
        message: 'Error advancing game phase',
      });
    }
  }

  /**
   * Called when all alive players have submitted votes.
   * Resolves the round and checks for game over.
   */
  private async handleAllVotesSubmitted(
    gameId: string,
    gameRoom: string,
  ): Promise<void> {
    try {
      await this.resolveAndAdvance(gameId, gameRoom);
    } catch (error) {
      this.logger.error(
        `Error handling all votes submitted for game ${gameId}: ${error}`,
      );
      this.server.to(gameRoom).emit('game:error', {
        message: 'Error resolving round',
      });
    }
  }

  /**
   * Resolve the current round via the engine, emit results,
   * and either end the game or start the next narration after a delay.
   */
  private async resolveAndAdvance(
    gameId: string,
    gameRoom: string,
  ): Promise<void> {
    // Resolve the round — this also handles endGame internally if needed
    const resolution = await this.engineService.resolveRound(gameId);

    // Emit resolution to all players
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

    // Use resolveRound's return value instead of calling checkGameOver separately
    if (resolution.isGameOver && resolution.gameResult) {
      // Game is over — result already computed by resolveRound/endGame
      this.server.to(gameRoom).emit('game:over', {
        result: resolution.gameResult.result,
        epilogue: resolution.gameResult.epilogue,
        scores: resolution.gameResult.scores,
      });

      // Update game status in DB
      await this.gamesService.updateGameStatus(gameId, 'FINISHED');

      // Clean up cached state
      await this.cacheService.deleteGameState(gameId);

      this.logger.log(`Game ${gameId} finished: ${resolution.gameResult.result}`);
    } else {
      // Start next round after a 5-second delay
      setTimeout(async () => {
        try {
          const narration =
            await this.engineService.startNarration(gameId);

          this.server.to(gameRoom).emit('game:narration', {
            text: narration.text,
            isStreaming: false,
          });

          this.server.to(gameRoom).emit('game:phase', {
            phase: 'NARRATION',
            round: narration.round,
          });

          this.logger.log(
            `Game ${gameId} started narration for round ${narration.round}`,
          );
        } catch (error) {
          this.logger.error(
            `Error starting next narration for game ${gameId}: ${error}`,
          );
          this.server.to(gameRoom).emit('game:error', {
            message: 'Error starting next round',
          });
        }
      }, 5000);
    }
  }

  // ===========================================================================
  // Utility helpers
  // ===========================================================================

  /**
   * Emit an updated lobby state to all clients in a lobby room.
   */
  private async emitLobbyUpdate(
    room: string,
    gameId?: string,
  ): Promise<void> {
    try {
      // Derive gameId from room name if not provided
      const id = gameId ?? room.replace('lobby:', '');

      const game = await this.gamesService.getGame(id);
      const players = game.players.map((p: any) => ({
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
    } catch (error) {
      this.logger.error(`Error emitting lobby update: ${error}`);
    }
  }
}
