import { GameStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScenariosService } from '../scenarios/scenarios.service';
import { CreateGameDto } from './dto/create-game.dto';
export declare class GamesService {
    private readonly prisma;
    private readonly scenariosService;
    constructor(prisma: PrismaService, scenariosService: ScenariosService);
    createGame(userId: string, dto: CreateGameDto): Promise<{
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    joinGame(userId: string, code: string): Promise<{
        scenario: {
            name: string;
            description: string;
            minPlayers: number;
            maxPlayers: number;
            duration: string;
            difficulty: string;
        } | null;
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
        events: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            gameId: string;
            round: number;
            phase: import(".prisma/client").$Enums.GamePhase;
            type: string;
            actorId: string | null;
            narrative: string | null;
        }[];
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    leaveGame(userId: string, gameId: string): Promise<{
        scenario: {
            name: string;
            description: string;
            minPlayers: number;
            maxPlayers: number;
            duration: string;
            difficulty: string;
        } | null;
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
        events: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            gameId: string;
            round: number;
            phase: import(".prisma/client").$Enums.GamePhase;
            type: string;
            actorId: string | null;
            narrative: string | null;
        }[];
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    } | {
        message: string;
    }>;
    getGame(gameId: string): Promise<{
        scenario: {
            name: string;
            description: string;
            minPlayers: number;
            maxPlayers: number;
            duration: string;
            difficulty: string;
        } | null;
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
        events: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            gameId: string;
            round: number;
            phase: import(".prisma/client").$Enums.GamePhase;
            type: string;
            actorId: string | null;
            narrative: string | null;
        }[];
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    getGameByCode(code: string): Promise<{
        scenario: {
            name: string;
            description: string;
            minPlayers: number;
            maxPlayers: number;
            duration: string;
            difficulty: string;
        } | null;
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
        events: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            gameId: string;
            round: number;
            phase: import(".prisma/client").$Enums.GamePhase;
            type: string;
            actorId: string | null;
            narrative: string | null;
        }[];
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    listPublicGames(): Promise<{
        playerCount: number;
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }[]>;
    getUserGames(userId: string): Promise<{
        playerCount: number;
        myRole: string | null;
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }[]>;
    updateGameStatus(gameId: string, status: GameStatus): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    saveGameState(gameId: string, state: unknown): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    addGameEvent(gameId: string, eventData: {
        round: number;
        phase: string;
        type: string;
        actorId?: string;
        data?: unknown;
        narrative?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        gameId: string;
        round: number;
        phase: import(".prisma/client").$Enums.GamePhase;
        type: string;
        actorId: string | null;
        narrative: string | null;
    }>;
    getGameEvents(gameId: string): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        gameId: string;
        round: number;
        phase: import(".prisma/client").$Enums.GamePhase;
        type: string;
        actorId: string | null;
        narrative: string | null;
    }[]>;
    endGame(gameId: string, results: {
        winnerIds: string[];
        scores?: Record<string, number>;
    }): Promise<{
        scenario: {
            name: string;
            description: string;
            minPlayers: number;
            maxPlayers: number;
            duration: string;
            difficulty: string;
        } | null;
        players: ({
            user: {
                username: string;
                avatar: string | null;
                id: string;
            };
        } & {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            gameId: string;
            role: string | null;
            isAlive: boolean;
            isHost: boolean;
            score: number;
            joinedAt: Date;
        })[];
        events: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            gameId: string;
            round: number;
            phase: import(".prisma/client").$Enums.GamePhase;
            type: string;
            actorId: string | null;
            narrative: string | null;
        }[];
        id: string;
        createdAt: Date;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        currentPhase: import(".prisma/client").$Enums.GamePhase;
        currentRound: number;
        maxRounds: number;
        maxPlayers: number;
        turnTimeout: number;
        isPrivate: boolean;
        hostId: string;
        stateSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    isHost(gameId: string, userId: string): Promise<boolean>;
    saveMessage(gameId: string, userId: string, content: string, type?: 'CHAT' | 'SYSTEM' | 'AI_NARRATION' | 'ACTION' | 'VOTE'): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        gameId: string;
        type: import(".prisma/client").$Enums.MessageType;
        content: string;
    }>;
    getPlayerList(gameId: string): Promise<({
        user: {
            username: string;
            avatar: string | null;
            id: string;
        };
    } & {
        id: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        gameId: string;
        role: string | null;
        isAlive: boolean;
        isHost: boolean;
        score: number;
        joinedAt: Date;
    })[]>;
    private generateUniqueCode;
    private generateGameCode;
}
