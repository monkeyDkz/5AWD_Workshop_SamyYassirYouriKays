import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats() {
    const [totalUsers, totalGames, activeGames, finishedToday] =
      await Promise.all([
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

  @Get('users')
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

  @Get('games')
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
}
