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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let CacheService = CacheService_1 = class CacheService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CacheService_1.name);
        this.redis = null;
        this.memoryCache = new Map();
        this.memoryCacheCleanupInterval = null;
        this.redisAvailable = false;
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.defaultTTL = this.configService.get('CACHE_TTL', 3600);
        try {
            this.redis = new ioredis_1.default(redisUrl, {
                retryStrategy: (times) => {
                    if (times > 3) {
                        this.logger.warn('Redis connection failed after 3 retries, falling back to in-memory cache');
                        this.redisAvailable = false;
                        return null;
                    }
                    return Math.min(times * 200, 2000);
                },
                lazyConnect: true,
                maxRetriesPerRequest: 3,
            });
            this.redis.on('error', (err) => {
                this.logger.warn(`Redis connection error: ${err.message}`);
                this.redisAvailable = false;
            });
            this.redis.on('connect', () => {
                this.logger.log('Connected to Redis');
                this.redisAvailable = true;
            });
            this.redis.on('close', () => {
                this.redisAvailable = false;
            });
            this.redis.connect().catch(() => {
                this.logger.warn('Redis not available, using in-memory cache as fallback');
                this.redisAvailable = false;
            });
        }
        catch (error) {
            this.logger.warn(`Failed to initialize Redis client: ${error}. Using in-memory cache.`);
            this.redis = null;
            this.redisAvailable = false;
        }
        this.memoryCacheCleanupInterval = setInterval(() => {
            this.cleanExpiredMemoryEntries();
        }, 60_000);
    }
    async onModuleDestroy() {
        if (this.memoryCacheCleanupInterval) {
            clearInterval(this.memoryCacheCleanupInterval);
        }
        if (this.redis) {
            try {
                await this.redis.quit();
            }
            catch {
            }
        }
    }
    async get(key) {
        try {
            if (this.redisAvailable && this.redis) {
                const value = await this.redis.get(key);
                if (!value)
                    return null;
                return JSON.parse(value);
            }
            return this.memoryGet(key);
        }
        catch (error) {
            this.logger.warn(`Cache get error for key "${key}": ${error}`);
            return this.memoryGet(key);
        }
    }
    async set(key, value, ttlSeconds) {
        const serialized = JSON.stringify(value);
        const ttl = ttlSeconds ?? this.defaultTTL;
        try {
            if (this.redisAvailable && this.redis) {
                await this.redis.set(key, serialized, 'EX', ttl);
                return;
            }
            this.memorySet(key, serialized, ttl);
        }
        catch (error) {
            this.logger.warn(`Cache set error for key "${key}": ${error}`);
            this.memorySet(key, serialized, ttl);
        }
    }
    async del(key) {
        try {
            if (this.redisAvailable && this.redis) {
                await this.redis.del(key);
            }
            this.memoryCache.delete(key);
        }
        catch (error) {
            this.logger.warn(`Cache del error for key "${key}": ${error}`);
            this.memoryCache.delete(key);
        }
    }
    async getGameState(gameId) {
        return this.get(`game:${gameId}:state`);
    }
    async setGameState(gameId, state) {
        await this.set(`game:${gameId}:state`, state, 3600);
    }
    async deleteGameState(gameId) {
        await this.del(`game:${gameId}:state`);
    }
    async setPlayerConnection(gameId, userId, socketId) {
        await this.set(`game:${gameId}:player:${userId}:socket`, socketId, 7200);
    }
    async getPlayerConnection(gameId, userId) {
        return this.get(`game:${gameId}:player:${userId}:socket`);
    }
    async removePlayerConnection(gameId, userId) {
        await this.del(`game:${gameId}:player:${userId}:socket`);
    }
    memoryGet(key) {
        const entry = this.memoryCache.get(key);
        if (!entry)
            return null;
        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }
        try {
            return JSON.parse(entry.value);
        }
        catch {
            return null;
        }
    }
    memorySet(key, serialized, ttlSeconds) {
        this.memoryCache.set(key, {
            value: serialized,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    cleanExpiredMemoryEntries() {
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.expiresAt !== null && now > entry.expiresAt) {
                this.memoryCache.delete(key);
            }
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map