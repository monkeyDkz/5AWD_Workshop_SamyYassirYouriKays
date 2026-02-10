import { PrismaService } from '../prisma/prisma.service';
export declare class AdminController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalUsers: number;
        totalGames: number;
        activeGames: number;
        finishedToday: number;
    }>;
    getUsers(): Promise<{
        id: string;
        username: string;
        email: string;
        createdAt: Date;
        gamesPlayed: number;
    }[]>;
    getGames(): Promise<{
        id: string;
        code: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        playerCount: number;
        maxPlayers: number;
        createdAt: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
    }[]>;
}
