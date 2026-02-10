import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
export declare class GamesController {
    private readonly gamesService;
    constructor(gamesService: GamesService);
    createGame(req: any, dto: CreateGameDto): Promise<{
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
    joinGame(req: any, dto: JoinGameDto): Promise<{
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
    getUserGames(req: any): Promise<{
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
    getGame(id: string): Promise<{
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
    leaveGame(req: any, id: string): Promise<{
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
    getGameEvents(id: string): Promise<{
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
}
