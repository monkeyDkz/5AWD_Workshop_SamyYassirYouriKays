import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, dto: UpdateUserDto): Promise<{
        username: string;
        avatar: string | null;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(req: any): Promise<{
        id: string;
        updatedAt: Date;
        userId: string;
        gamesPlayed: number;
        gamesWon: number;
        totalPlaytimeMin: number;
        favoriteScenario: string | null;
    }>;
    getGameHistory(req: any): Promise<{
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
    getLeaderboard(limit?: string): Promise<{
        userId: string;
        username: string;
        avatar: string | null;
        gamesPlayed: number;
        gamesWon: number;
        totalPlaytimeMin: number;
        favoriteScenario: string | null;
    }[]>;
}
