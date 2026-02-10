import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        stats: {
            id: string;
            updatedAt: Date;
            userId: string;
            gamesPlayed: number;
            gamesWon: number;
            totalPlaytimeMin: number;
            favoriteScenario: string | null;
        } | null;
        username: string;
        avatar: string | null;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        username: string;
        avatar: string | null;
        id: string;
        email: string;
        passwordHash: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByUsername(username: string): Promise<{
        username: string;
        avatar: string | null;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateUserDto): Promise<{
        username: string;
        avatar: string | null;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(userId: string): Promise<{
        id: string;
        updatedAt: Date;
        userId: string;
        gamesPlayed: number;
        gamesWon: number;
        totalPlaytimeMin: number;
        favoriteScenario: string | null;
    }>;
    updateStats(userId: string, data: {
        gamesPlayed?: number;
        gamesWon?: number;
        totalPlaytimeMin?: number;
        favoriteScenario?: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        userId: string;
        gamesPlayed: number;
        gamesWon: number;
        totalPlaytimeMin: number;
        favoriteScenario: string | null;
    }>;
    getLeaderboard(limit?: number): Promise<{
        userId: string;
        username: string;
        avatar: string | null;
        gamesPlayed: number;
        gamesWon: number;
        totalPlaytimeMin: number;
        favoriteScenario: string | null;
    }[]>;
    getGameHistory(userId: string): Promise<{
        gameId: string;
        scenarioSlug: string;
        status: import(".prisma/client").$Enums.GameStatus;
        role: string | null;
        isAlive: boolean;
        score: number;
        createdAt: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
    }[]>;
}
