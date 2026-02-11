import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EngineService } from '../engine/engine.service';
import { GamesService } from '../games/games.service';
import { AuthService } from '../auth/auth.service';
import { CacheService } from '../cache/cache.service';
import { ClientToServerEvents, ServerToClientEvents } from './websocket.types';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly engineService;
    private readonly gamesService;
    private readonly authService;
    private readonly cacheService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    server: Server<ClientToServerEvents, ServerToClientEvents>;
    private readonly socketUsers;
    private readonly socketRooms;
    private readonly disconnectTimers;
    constructor(engineService: EngineService, gamesService: GamesService, authService: AuthService, cacheService: CacheService, jwtService: JwtService, configService: ConfigService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private authenticateClient;
    private getUserFromSocket;
    private trackRoom;
    private untrackRoom;
    handleLobbyJoin(client: Socket, data: {
        code: string;
        token: string;
    }): Promise<void>;
    handleLobbyLeave(client: Socket, data: {
        code: string;
    }): Promise<void>;
    handleLobbyChat(client: Socket, data: {
        code: string;
        message: string;
    }): Promise<void>;
    handleGameStart(client: Socket, data: {
        gameId: string;
    }): Promise<void>;
    handleGameJoin(client: Socket, data: {
        gameId: string;
        token: string;
    }): Promise<void>;
    handleGameLeave(client: Socket, data: {
        gameId: string;
    }): Promise<void>;
    handleGameAction(client: Socket, data: {
        gameId: string;
        action: string;
    }): Promise<void>;
    handleGameVote(client: Socket, data: {
        gameId: string;
        targetId: string;
    }): Promise<void>;
    handleGameChat(client: Socket, data: {
        gameId: string;
        message: string;
    }): Promise<void>;
    handleAdvancePhase(client: Socket, data: {
        gameId: string;
    }): Promise<void>;
    private handleAllActionsSubmitted;
    private handleAllVotesSubmitted;
    private resolveAndAdvance;
    private sendActionSuggestions;
    private emitLobbyUpdate;
}
