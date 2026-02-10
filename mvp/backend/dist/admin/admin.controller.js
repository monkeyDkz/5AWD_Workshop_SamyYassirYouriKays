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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminController = class AdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const [totalUsers, totalGames, activeGames, finishedToday] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.game.count(),
            this.prisma.game.count({
                where: { status: { in: ['LOBBY', 'IN_PROGRESS'] } },
            }),
            this.prisma.game.count({
                where: {
                    status: 'FINISHED',
                    finishedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);
        return { totalUsers, totalGames, activeGames, finishedToday };
    }
    async getUsers() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                stats: {
                    select: { gamesPlayed: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            createdAt: u.createdAt,
            gamesPlayed: u.stats?.gamesPlayed ?? 0,
        }));
    }
    async getGames() {
        const games = await this.prisma.game.findMany({
            include: {
                players: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return games.map((g) => ({
            id: g.id,
            code: g.code,
            scenarioSlug: g.scenarioSlug,
            status: g.status,
            playerCount: g.players.length,
            maxPlayers: g.maxPlayers,
            createdAt: g.createdAt,
            startedAt: g.startedAt,
            finishedAt: g.finishedAt,
        }));
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('games'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getGames", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map