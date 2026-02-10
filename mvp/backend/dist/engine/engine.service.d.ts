import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { AiService } from '../ai/ai.service';
import { ScenariosService } from '../scenarios/scenarios.service';
import { GamesService } from '../games/games.service';
import { GameState, GameResult, NarrationResult, ResolveRoundResult } from './engine.types';
export declare class EngineService {
    private readonly prisma;
    private readonly cache;
    private readonly aiService;
    private readonly scenariosService;
    private readonly gamesService;
    private readonly logger;
    constructor(prisma: PrismaService, cache: CacheService, aiService: AiService, scenariosService: ScenariosService, gamesService: GamesService);
    initializeGame(gameId: string): Promise<GameState>;
    startNarration(gameId: string): Promise<NarrationResult>;
    submitAction(gameId: string, userId: string, action: string): Promise<{
        remaining: number;
        allActed: boolean;
    }>;
    submitVote(gameId: string, userId: string, targetId: string): Promise<{
        remaining: number;
        allVoted: boolean;
    }>;
    resolveRound(gameId: string): Promise<ResolveRoundResult>;
    private endGame;
    advancePhase(gameId: string): Promise<GameState>;
    getGameState(gameId: string): Promise<GameState | null>;
    checkGameOver(gameId: string): Promise<GameResult | null>;
    getActionSuggestions(gameId: string, userId: string): Promise<string[]>;
    private loadState;
    private saveState;
    private getCurrentRound;
    private buildGameContext;
    private tallyVotes;
    private checkWinConditions;
    private checkDeepWinConditions;
    private checkTribunalWinConditions;
    private calculateScores;
}
