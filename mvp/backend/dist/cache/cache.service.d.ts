import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameState } from '../engine/engine.types';
export declare class CacheService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redis;
    private readonly defaultTTL;
    private readonly memoryCache;
    private memoryCacheCleanupInterval;
    private redisAvailable;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    getGameState(gameId: string): Promise<GameState | null>;
    setGameState(gameId: string, state: GameState): Promise<void>;
    deleteGameState(gameId: string): Promise<void>;
    setPlayerConnection(gameId: string, userId: string, socketId: string): Promise<void>;
    getPlayerConnection(gameId: string, userId: string): Promise<string | null>;
    removePlayerConnection(gameId: string, userId: string): Promise<void>;
    private memoryGet;
    private memorySet;
    private cleanExpiredMemoryEntries;
}
