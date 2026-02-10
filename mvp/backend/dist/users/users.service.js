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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { stats: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findByUsername(username) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateProfile(userId, dto) {
        if (dto.username) {
            const existing = await this.prisma.user.findUnique({
                where: { username: dto.username },
            });
            if (existing && existing.id !== userId) {
                throw new common_1.ConflictException('Username is already taken');
            }
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.username && { username: dto.username }),
                ...(dto.avatar !== undefined && { avatar: dto.avatar }),
            },
        });
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async getStats(userId) {
        const stats = await this.prisma.userStats.findUnique({
            where: { userId },
        });
        if (!stats) {
            throw new common_1.NotFoundException('User stats not found');
        }
        return stats;
    }
    async updateStats(userId, data) {
        return this.prisma.userStats.update({
            where: { userId },
            data,
        });
    }
    async getLeaderboard(limit = 10) {
        const stats = await this.prisma.userStats.findMany({
            take: limit,
            orderBy: { gamesWon: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
        return stats.map((entry) => ({
            userId: entry.user.id,
            username: entry.user.username,
            avatar: entry.user.avatar,
            gamesPlayed: entry.gamesPlayed,
            gamesWon: entry.gamesWon,
            totalPlaytimeMin: entry.totalPlaytimeMin,
            favoriteScenario: entry.favoriteScenario,
        }));
    }
    async getGameHistory(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const gamePlayers = await this.prisma.gamePlayer.findMany({
            where: { userId },
            include: {
                game: true,
            },
            orderBy: {
                joinedAt: 'desc',
            },
        });
        return gamePlayers.map((gp) => ({
            gameId: gp.game.id,
            scenarioSlug: gp.game.scenarioSlug,
            status: gp.game.status,
            role: gp.role,
            isAlive: gp.isAlive,
            score: gp.score,
            createdAt: gp.game.createdAt,
            startedAt: gp.game.startedAt,
            finishedAt: gp.game.finishedAt,
        }));
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map