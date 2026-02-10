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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
const ai_service_1 = require("../ai/ai.service");
const scenarios_service_1 = require("../scenarios/scenarios.service");
const games_service_1 = require("../games/games.service");
let EngineService = EngineService_1 = class EngineService {
    constructor(prisma, cache, aiService, scenariosService, gamesService) {
        this.prisma = prisma;
        this.cache = cache;
        this.aiService = aiService;
        this.scenariosService = scenariosService;
        this.gamesService = gamesService;
        this.logger = new common_1.Logger(EngineService_1.name);
    }
    async initializeGame(gameId) {
        this.logger.log(`Initializing game ${gameId}`);
        const game = await this.gamesService.getGame(gameId);
        if (!game) {
            throw new common_1.NotFoundException(`Game "${gameId}" not found`);
        }
        if (game.status !== 'LOBBY') {
            throw new common_1.BadRequestException('Game is not in LOBBY status');
        }
        const scenario = this.scenariosService.getScenario(game.scenarioSlug);
        const scenarioConfig = this.scenariosService.getScenarioConfig(game.scenarioSlug);
        const playerCount = game.players.length;
        if (playerCount < scenario.minPlayers) {
            throw new common_1.BadRequestException(`Need at least ${scenario.minPlayers} players to start (currently ${playerCount})`);
        }
        const roleAssignments = this.scenariosService.getRolesForPlayers(game.scenarioSlug, playerCount);
        const playerGaugeDefaults = {};
        for (const gauge of scenarioConfig.gauges) {
            if (gauge.appliesTo === 'player' || gauge.appliesTo === 'all') {
                playerGaugeDefaults[gauge.id] = gauge.initial;
            }
        }
        const globalGauges = {};
        for (const gauge of scenarioConfig.gauges) {
            if (gauge.appliesTo === 'global' || gauge.appliesTo === 'all') {
                globalGauges[gauge.id] = gauge.initial;
            }
        }
        const players = [];
        const dbUpdates = [];
        for (let i = 0; i < game.players.length; i++) {
            const dbPlayer = game.players[i];
            const role = roleAssignments[i];
            const playerState = {
                userId: dbPlayer.userId,
                username: dbPlayer.user.username,
                role: role.name,
                team: role.team,
                isAlive: true,
                isConnected: true,
                gauges: { ...playerGaugeDefaults },
                score: 0,
            };
            players.push(playerState);
            dbUpdates.push({
                userId: dbPlayer.userId,
                role: role.id,
                data: {
                    roleName: role.name,
                    team: role.team,
                    gauges: { ...playerGaugeDefaults },
                },
            });
        }
        for (const update of dbUpdates) {
            await this.prisma.gamePlayer.update({
                where: {
                    gameId_userId: { gameId, userId: update.userId },
                },
                data: {
                    role: update.role,
                    data: update.data,
                },
            });
        }
        const now = new Date().toISOString();
        const state = {
            gameId,
            scenarioSlug: game.scenarioSlug,
            status: 'IN_PROGRESS',
            currentPhase: 'NARRATION',
            currentRound: 1,
            maxRounds: scenarioConfig.maxRounds,
            players,
            globalGauges,
            rounds: [],
            hostId: game.hostId,
            createdAt: game.createdAt?.toISOString?.() ?? now,
            startedAt: now,
            finishedAt: null,
        };
        const firstRound = {
            round: 1,
            phase: 'NARRATION',
            narration: null,
            actions: [],
            votes: [],
            resolution: null,
            startedAt: now,
        };
        state.rounds.push(firstRound);
        await this.cache.setGameState(gameId, state);
        await this.gamesService.saveGameState(gameId, state);
        await this.prisma.game.update({
            where: { id: gameId },
            data: {
                status: 'IN_PROGRESS',
                currentPhase: 'NARRATION',
                currentRound: 1,
                startedAt: new Date(),
            },
        });
        await this.gamesService.addGameEvent(gameId, {
            round: 1,
            phase: 'NARRATION',
            type: 'GAME_STARTED',
            data: {
                playerCount,
                roles: players.map((p) => ({
                    userId: p.userId,
                    role: p.role,
                    team: p.team,
                })),
            },
        });
        this.logger.log(`Game ${gameId} initialized with ${playerCount} players, scenario: ${game.scenarioSlug}`);
        return state;
    }
    async startNarration(gameId) {
        this.logger.log(`Starting narration for game ${gameId}`);
        const state = await this.loadState(gameId);
        const scenario = this.scenariosService.getScenario(state.scenarioSlug);
        const config = this.scenariosService.getScenarioConfig(state.scenarioSlug);
        const context = this.buildGameContext(state);
        let userPrompt;
        if (state.currentRound === 1) {
            userPrompt = config.aiPrompt.introPrompt;
        }
        else {
            const prevRound = state.rounds[state.currentRound - 2];
            const actionsText = prevRound?.actions
                ?.map((a) => {
                const player = state.players.find((p) => p.userId === a.userId);
                return `${player?.username || a.userId}: ${a.action}`;
            })
                .join('; ') || 'Aucune action';
            userPrompt = config.aiPrompt.roundPrompt
                .replace('{round}', String(state.currentRound))
                .replace('{maxRounds}', String(state.maxRounds))
                .replace('{actions}', actionsText);
            for (const [gaugeId, gaugeValue] of Object.entries(state.globalGauges)) {
                userPrompt = userPrompt.replace(`{${gaugeId}}`, String(gaugeValue));
            }
        }
        const narrative = await this.aiService.narrate(config.aiPrompt.systemPrompt, userPrompt, context);
        const currentRound = this.getCurrentRound(state);
        currentRound.narration = narrative;
        currentRound.phase = 'NARRATION';
        state.currentPhase = 'NARRATION';
        await this.saveState(state);
        await this.gamesService.addGameEvent(gameId, {
            round: state.currentRound,
            phase: 'NARRATION',
            type: 'NARRATION_GENERATED',
            narrative,
        });
        return {
            text: narrative,
            phase: 'NARRATION',
            round: state.currentRound,
        };
    }
    async submitAction(gameId, userId, action) {
        this.logger.log(`Action from ${userId} in game ${gameId}: ${action}`);
        const state = await this.loadState(gameId);
        if (state.currentPhase !== 'ACTION') {
            throw new common_1.BadRequestException(`Cannot submit action in phase ${state.currentPhase}`);
        }
        const player = state.players.find((p) => p.userId === userId);
        if (!player) {
            throw new common_1.NotFoundException('Player not found in this game');
        }
        if (!player.isAlive) {
            throw new common_1.BadRequestException('Eliminated players cannot act');
        }
        const currentRound = this.getCurrentRound(state);
        const alreadyActed = currentRound.actions.some((a) => a.userId === userId);
        if (alreadyActed) {
            throw new common_1.BadRequestException('You have already submitted an action this round');
        }
        const roundAction = {
            userId,
            action,
            submittedAt: new Date().toISOString(),
        };
        currentRound.actions.push(roundAction);
        await this.gamesService.addGameEvent(gameId, {
            round: state.currentRound,
            phase: 'ACTION',
            type: 'ACTION_SUBMITTED',
            actorId: userId,
            data: { action },
        });
        const alivePlayers = state.players.filter((p) => p.isAlive);
        const actedPlayerIds = new Set(currentRound.actions.map((a) => a.userId));
        const remaining = alivePlayers.filter((p) => !actedPlayerIds.has(p.userId)).length;
        const allActed = remaining === 0;
        if (allActed) {
            currentRound.phase = 'VOTE';
            state.currentPhase = 'VOTE';
            await this.prisma.game.update({
                where: { id: gameId },
                data: { currentPhase: 'VOTE' },
            });
            this.logger.log(`All players acted in game ${gameId}, advancing to VOTE phase`);
        }
        await this.saveState(state);
        return { remaining, allActed };
    }
    async submitVote(gameId, userId, targetId) {
        this.logger.log(`Vote from ${userId} targeting ${targetId} in game ${gameId}`);
        const state = await this.loadState(gameId);
        if (state.currentPhase !== 'VOTE') {
            throw new common_1.BadRequestException(`Cannot submit vote in phase ${state.currentPhase}`);
        }
        const voter = state.players.find((p) => p.userId === userId);
        if (!voter) {
            throw new common_1.NotFoundException('Voter not found in this game');
        }
        if (!voter.isAlive) {
            throw new common_1.BadRequestException('Eliminated players cannot vote');
        }
        const target = state.players.find((p) => p.userId === targetId);
        if (!target) {
            throw new common_1.NotFoundException('Vote target not found in this game');
        }
        if (!target.isAlive) {
            throw new common_1.BadRequestException('Cannot vote for an eliminated player');
        }
        const currentRound = this.getCurrentRound(state);
        const alreadyVoted = currentRound.votes.some((v) => v.userId === userId);
        if (alreadyVoted) {
            throw new common_1.BadRequestException('You have already voted this round');
        }
        const roundVote = {
            userId,
            targetId,
            submittedAt: new Date().toISOString(),
        };
        currentRound.votes.push(roundVote);
        await this.gamesService.addGameEvent(gameId, {
            round: state.currentRound,
            phase: 'VOTE',
            type: 'VOTE_SUBMITTED',
            actorId: userId,
            data: { targetId },
        });
        const alivePlayers = state.players.filter((p) => p.isAlive);
        const votedPlayerIds = new Set(currentRound.votes.map((v) => v.userId));
        const remaining = alivePlayers.filter((p) => !votedPlayerIds.has(p.userId)).length;
        const allVoted = remaining === 0;
        if (allVoted) {
            currentRound.phase = 'RESOLUTION';
            state.currentPhase = 'RESOLUTION';
            await this.prisma.game.update({
                where: { id: gameId },
                data: { currentPhase: 'RESOLUTION' },
            });
            this.logger.log(`All players voted in game ${gameId}, advancing to RESOLUTION phase`);
        }
        await this.saveState(state);
        return { remaining, allVoted };
    }
    async resolveRound(gameId) {
        this.logger.log(`Resolving round for game ${gameId}`);
        const state = await this.loadState(gameId);
        const scenario = this.scenariosService.getScenario(state.scenarioSlug);
        const currentRound = this.getCurrentRound(state);
        const voteTally = this.tallyVotes(currentRound.votes);
        const mostVotedId = voteTally.length > 0 ? voteTally[0].userId : null;
        const mostVotedCount = voteTally.length > 0 ? voteTally[0].count : 0;
        const isTie = voteTally.length > 1 && voteTally[0].count === voteTally[1].count;
        const aiResult = await this.aiService.resolveActions(scenario, state, currentRound.actions);
        const gaugeChanges = {};
        if (aiResult.stateChanges.globalGauges) {
            gaugeChanges['global'] = {};
            for (const [gaugeId, delta] of Object.entries(aiResult.stateChanges.globalGauges)) {
                const prevValue = state.globalGauges[gaugeId] ?? 0;
                const gaugeConfig = scenario.gauges.find((g) => g.id === gaugeId);
                const min = gaugeConfig?.min ?? 0;
                const max = gaugeConfig?.max ?? 100;
                const newValue = Math.max(min, Math.min(max, prevValue + delta));
                gaugeChanges['global'][gaugeId] = delta;
                state.globalGauges[gaugeId] = newValue;
            }
        }
        if (aiResult.stateChanges.playerGauges) {
            for (const [playerId, changes] of Object.entries(aiResult.stateChanges.playerGauges)) {
                const player = state.players.find((p) => p.userId === playerId);
                if (player && player.isAlive) {
                    gaugeChanges[playerId] = {};
                    for (const [gaugeId, delta] of Object.entries(changes)) {
                        const prevValue = player.gauges[gaugeId] ?? 0;
                        const gaugeConfig = scenario.gauges.find((g) => g.id === gaugeId);
                        const min = gaugeConfig?.min ?? 0;
                        const max = gaugeConfig?.max ?? 100;
                        const newValue = Math.max(min, Math.min(max, prevValue + delta));
                        gaugeChanges[playerId][gaugeId] = delta;
                        player.gauges[gaugeId] = newValue;
                    }
                }
            }
        }
        const eliminations = [];
        if (mostVotedId && !isTie) {
            const targetPlayer = state.players.find((p) => p.userId === mostVotedId);
            if (targetPlayer && targetPlayer.isAlive) {
                if (targetPlayer.gauges.suspicion !== undefined) {
                    const suspicionIncrease = mostVotedCount * 15;
                    targetPlayer.gauges.suspicion = Math.min(100, targetPlayer.gauges.suspicion + suspicionIncrease);
                    if (!gaugeChanges[mostVotedId]) {
                        gaugeChanges[mostVotedId] = {};
                    }
                    gaugeChanges[mostVotedId].suspicion =
                        (gaugeChanges[mostVotedId].suspicion ?? 0) + suspicionIncrease;
                }
                const alivePlayers = state.players.filter((p) => p.isAlive);
                const majorityThreshold = Math.ceil(alivePlayers.length / 2);
                if (mostVotedCount >= majorityThreshold) {
                    if (state.scenarioSlug === 'deep' &&
                        targetPlayer.team === 'saboteur') {
                        targetPlayer.isAlive = false;
                        eliminations.push(mostVotedId);
                    }
                    else if (state.scenarioSlug === 'deep') {
                        state.globalGauges.moral = Math.max(0, (state.globalGauges.moral ?? 50) - 15);
                        if (!gaugeChanges['global'])
                            gaugeChanges['global'] = {};
                        gaugeChanges['global'].moral =
                            (gaugeChanges['global'].moral ?? 0) - 15;
                    }
                }
            }
        }
        if (aiResult.stateChanges.eliminations) {
            for (const eliminatedId of aiResult.stateChanges.eliminations) {
                const player = state.players.find((p) => p.userId === eliminatedId);
                if (player && player.isAlive && !eliminations.includes(eliminatedId)) {
                    player.isAlive = false;
                    eliminations.push(eliminatedId);
                }
            }
        }
        for (const player of state.players) {
            await this.prisma.gamePlayer.update({
                where: {
                    gameId_userId: { gameId, userId: player.userId },
                },
                data: {
                    isAlive: player.isAlive,
                    data: {
                        roleName: player.role,
                        team: player.team,
                        gauges: player.gauges,
                    },
                },
            });
        }
        const resolution = {
            narrative: aiResult.narrative,
            eliminations,
            gaugeChanges,
        };
        currentRound.resolution = resolution;
        const winCheck = this.checkWinConditions(state, scenario);
        let gameResult;
        if (winCheck.isOver) {
            gameResult = await this.endGame(gameId, state, scenario, winCheck.result || 'Partie terminee', winCheck.winners || [], winCheck.winningTeam);
        }
        else {
            state.currentRound += 1;
            state.currentPhase = 'NARRATION';
            const nextRound = {
                round: state.currentRound,
                phase: 'NARRATION',
                narration: null,
                actions: [],
                votes: [],
                resolution: null,
                startedAt: new Date().toISOString(),
            };
            state.rounds.push(nextRound);
            await this.prisma.game.update({
                where: { id: gameId },
                data: {
                    currentRound: state.currentRound,
                    currentPhase: 'NARRATION',
                },
            });
        }
        await this.gamesService.addGameEvent(gameId, {
            round: currentRound.round,
            phase: 'RESOLUTION',
            type: 'ROUND_RESOLVED',
            data: {
                eliminations,
                gaugeChanges,
                isGameOver: winCheck.isOver,
            },
            narrative: aiResult.narrative,
        });
        await this.saveState(state);
        this.logger.log(`Round ${currentRound.round} resolved for game ${gameId}. ` +
            `Eliminations: ${eliminations.length}. Game over: ${winCheck.isOver}`);
        return {
            narrative: aiResult.narrative,
            eliminations,
            gaugeChanges,
            isGameOver: winCheck.isOver,
            gameResult,
        };
    }
    async endGame(gameId, state, scenario, result, winners, winningTeam) {
        this.logger.log(`Ending game ${gameId}: ${result}`);
        const epilogue = await this.aiService.generateEpilogue(scenario, state, result);
        this.calculateScores(state, winners, winningTeam);
        const gameResult = {
            result,
            epilogue,
            winners,
            scores: state.players.map((p) => ({
                userId: p.userId,
                username: p.username,
                score: p.score,
                role: p.role,
                team: p.team,
            })),
        };
        state.status = 'FINISHED';
        state.finishedAt = new Date().toISOString();
        state.currentPhase = 'RESOLUTION';
        await this.prisma.game.update({
            where: { id: gameId },
            data: {
                status: 'FINISHED',
                finishedAt: new Date(),
                stateSnapshot: state,
            },
        });
        for (const player of state.players) {
            await this.prisma.gamePlayer.update({
                where: {
                    gameId_userId: { gameId, userId: player.userId },
                },
                data: {
                    score: player.score,
                },
            });
        }
        const winnerSet = new Set(winners);
        for (const player of state.players) {
            try {
                await this.prisma.userStats.updateMany({
                    where: { userId: player.userId },
                    data: {
                        gamesPlayed: { increment: 1 },
                        ...(winnerSet.has(player.userId)
                            ? { gamesWon: { increment: 1 } }
                            : {}),
                    },
                });
            }
            catch (error) {
                this.logger.warn(`Failed to update stats for user ${player.userId}: ${error}`);
            }
        }
        await this.gamesService.addGameEvent(gameId, {
            round: state.currentRound,
            phase: 'RESOLUTION',
            type: 'GAME_ENDED',
            data: gameResult,
            narrative: epilogue,
        });
        await this.saveState(state);
        return gameResult;
    }
    async advancePhase(gameId) {
        this.logger.log(`Advancing phase for game ${gameId}`);
        const state = await this.loadState(gameId);
        switch (state.currentPhase) {
            case 'NARRATION':
                state.currentPhase = 'ACTION';
                this.getCurrentRound(state).phase = 'ACTION';
                break;
            case 'ACTION':
                state.currentPhase = 'VOTE';
                this.getCurrentRound(state).phase = 'VOTE';
                break;
            case 'VOTE':
                state.currentPhase = 'RESOLUTION';
                this.getCurrentRound(state).phase = 'RESOLUTION';
                break;
            case 'RESOLUTION':
                if (state.currentRound < state.maxRounds) {
                    state.currentRound += 1;
                    state.currentPhase = 'NARRATION';
                    const nextRound = {
                        round: state.currentRound,
                        phase: 'NARRATION',
                        narration: null,
                        actions: [],
                        votes: [],
                        resolution: null,
                        startedAt: new Date().toISOString(),
                    };
                    state.rounds.push(nextRound);
                }
                break;
            default:
                throw new common_1.BadRequestException(`Cannot advance from phase ${state.currentPhase}`);
        }
        await this.prisma.game.update({
            where: { id: gameId },
            data: {
                currentPhase: state.currentPhase,
                currentRound: state.currentRound,
            },
        });
        await this.saveState(state);
        return state;
    }
    async getGameState(gameId) {
        const cached = await this.cache.getGameState(gameId);
        if (cached) {
            return cached;
        }
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            select: { stateSnapshot: true },
        });
        if (game?.stateSnapshot) {
            const state = game.stateSnapshot;
            await this.cache.setGameState(gameId, state);
            return state;
        }
        return null;
    }
    async checkGameOver(gameId) {
        const state = await this.loadState(gameId);
        const scenario = this.scenariosService.getScenario(state.scenarioSlug);
        const winCondition = this.checkWinConditions(state, scenario);
        if (!winCondition.isOver) {
            return null;
        }
        return this.endGame(gameId, state, scenario, winCondition.result ?? 'Game over', winCondition.winners ?? [], winCondition.winningTeam);
    }
    async getActionSuggestions(gameId, userId) {
        const state = await this.loadState(gameId);
        const scenario = this.scenariosService.getScenario(state.scenarioSlug);
        const player = state.players.find((p) => p.userId === userId);
        if (!player) {
            throw new common_1.NotFoundException('Player not found in this game');
        }
        return this.aiService.generateActionSuggestions(scenario, state, player.role);
    }
    async loadState(gameId) {
        const state = await this.getGameState(gameId);
        if (!state) {
            throw new common_1.NotFoundException(`Game state for "${gameId}" not found. Has the game been initialized?`);
        }
        return state;
    }
    async saveState(state) {
        await this.cache.setGameState(state.gameId, state);
        await this.gamesService.saveGameState(state.gameId, state);
    }
    getCurrentRound(state) {
        const round = state.rounds.find((r) => r.round === state.currentRound);
        if (!round) {
            const newRound = {
                round: state.currentRound,
                phase: state.currentPhase,
                narration: null,
                actions: [],
                votes: [],
                resolution: null,
                startedAt: new Date().toISOString(),
            };
            state.rounds.push(newRound);
            return newRound;
        }
        return round;
    }
    buildGameContext(state) {
        const lines = [];
        lines.push(`Partie: ${state.gameId}`);
        lines.push(`Scenario: ${state.scenarioSlug}`);
        lines.push(`Round: ${state.currentRound}/${state.maxRounds}`);
        lines.push(`Phase: ${state.currentPhase}`);
        lines.push('');
        lines.push('Jauges globales:');
        for (const [gaugeId, value] of Object.entries(state.globalGauges)) {
            lines.push(`  - ${gaugeId}: ${value}%`);
        }
        lines.push('');
        lines.push('Joueurs:');
        for (const player of state.players) {
            const status = player.isAlive ? 'en vie' : 'elimine';
            const gaugesStr = Object.entries(player.gauges)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
            lines.push(`  - ${player.username} (${player.role}, equipe ${player.team}) [${status}] Jauges: ${gaugesStr}`);
        }
        if (state.rounds.length > 0) {
            lines.push('');
            lines.push('Historique recent:');
            const recentRounds = state.rounds.slice(-3);
            for (const round of recentRounds) {
                lines.push(`  Round ${round.round}:`);
                if (round.narration) {
                    lines.push(`    Narration: ${round.narration.substring(0, 200)}...`);
                }
                if (round.actions.length > 0) {
                    lines.push(`    Actions: ${round.actions.map((a) => `${a.userId}: ${a.action}`).join('; ')}`);
                }
                if (round.resolution) {
                    lines.push(`    Resolution: ${round.resolution.narrative.substring(0, 200)}...`);
                    if (round.resolution.eliminations.length > 0) {
                        lines.push(`    Eliminations: ${round.resolution.eliminations.join(', ')}`);
                    }
                }
            }
        }
        return lines.join('\n');
    }
    tallyVotes(votes) {
        const tally = new Map();
        for (const vote of votes) {
            tally.set(vote.targetId, (tally.get(vote.targetId) || 0) + 1);
        }
        return Array.from(tally.entries())
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => b.count - a.count);
    }
    checkWinConditions(state, scenario) {
        if (state.scenarioSlug === 'deep') {
            return this.checkDeepWinConditions(state);
        }
        if (state.scenarioSlug === 'tribunal') {
            return this.checkTribunalWinConditions(state);
        }
        if (state.currentRound >= state.maxRounds) {
            return {
                isOver: true,
                result: 'Partie terminee apres le dernier round',
                winners: state.players
                    .filter((p) => p.isAlive)
                    .map((p) => p.userId),
            };
        }
        return { isOver: false };
    }
    checkDeepWinConditions(state) {
        const pression = state.globalGauges.pression ?? 0;
        const saboteur = state.players.find((p) => p.team === 'saboteur');
        const equipagePlayers = state.players.filter((p) => p.team === 'equipage');
        if (pression <= 0) {
            const saboteurId = saboteur?.userId;
            return {
                isOver: true,
                result: 'La pression de la coque est tombee a zero! La station est detruite. Le saboteur a gagne.',
                winners: saboteurId ? [saboteurId] : [],
                winningTeam: 'saboteur',
            };
        }
        if (saboteur && !saboteur.isAlive) {
            return {
                isOver: true,
                result: "Le saboteur a ete identifie et neutralise! L'equipage a gagne.",
                winners: equipagePlayers
                    .filter((p) => p.isAlive)
                    .map((p) => p.userId),
                winningTeam: 'equipage',
            };
        }
        const aliveEquipage = equipagePlayers.filter((p) => p.isAlive);
        if (aliveEquipage.length === 0) {
            return {
                isOver: true,
                result: "Tout l'equipage a ete elimine! Le saboteur remporte la victoire.",
                winners: saboteur ? [saboteur.userId] : [],
                winningTeam: 'saboteur',
            };
        }
        if (state.currentRound >= state.maxRounds && pression > 50) {
            return {
                isOver: true,
                result: "La station a survecu! L'equipage a maintenu la pression et remporte la victoire.",
                winners: equipagePlayers
                    .filter((p) => p.isAlive)
                    .map((p) => p.userId),
                winningTeam: 'equipage',
            };
        }
        if (state.currentRound >= state.maxRounds) {
            return {
                isOver: true,
                result: 'La station est gravement endommagee. Le saboteur a reussi sa mission.',
                winners: saboteur ? [saboteur.userId] : [],
                winningTeam: 'saboteur',
            };
        }
        return { isOver: false };
    }
    checkTribunalWinConditions(state) {
        if (state.currentRound < state.maxRounds) {
            return { isOver: false };
        }
        const currentRound = this.getCurrentRound(state);
        const votes = currentRound.votes;
        const accuse = state.players.find((p) => p.role === 'Accuse' || p.role === 'accuse');
        if (!accuse) {
            return {
                isOver: true,
                result: 'Le proces est termine. Aucun verdict clair.',
                winners: state.players.map((p) => p.userId),
            };
        }
        const guiltyVotes = votes.filter((v) => v.targetId === accuse.userId).length;
        const totalVotes = votes.length;
        const notGuiltyVotes = totalVotes - guiltyVotes;
        if (guiltyVotes > notGuiltyVotes) {
            const accusationPlayers = state.players.filter((p) => p.team === 'accusation');
            return {
                isOver: true,
                result: `L'accuse est reconnu COUPABLE par ${guiltyVotes} voix contre ${notGuiltyVotes}!`,
                winners: accusationPlayers.map((p) => p.userId),
                winningTeam: 'accusation',
            };
        }
        else if (notGuiltyVotes > guiltyVotes) {
            const defensePlayers = state.players.filter((p) => p.team === 'defense');
            return {
                isOver: true,
                result: `L'accuse est ACQUITTE par ${notGuiltyVotes} voix contre ${guiltyVotes}!`,
                winners: defensePlayers.map((p) => p.userId),
                winningTeam: 'defense',
            };
        }
        else {
            const defensePlayers = state.players.filter((p) => p.team === 'defense');
            return {
                isOver: true,
                result: `Egalite des voix (${guiltyVotes}-${notGuiltyVotes})! En cas de doute, l'accuse beneficie de la presomption d'innocence. ACQUITTE!`,
                winners: defensePlayers.map((p) => p.userId),
                winningTeam: 'defense',
            };
        }
    }
    calculateScores(state, winners, winningTeam) {
        const winnerSet = new Set(winners);
        for (const player of state.players) {
            let score = 0;
            score += 10;
            if (player.isAlive) {
                score += 20;
            }
            if (winnerSet.has(player.userId)) {
                score += 50;
            }
            else if (winningTeam && player.team === winningTeam) {
                score += 25;
            }
            const playerActions = state.rounds.reduce((count, round) => {
                return (count + round.actions.filter((a) => a.userId === player.userId).length);
            }, 0);
            score += playerActions * 5;
            const playerVotes = state.rounds.reduce((count, round) => {
                return (count + round.votes.filter((v) => v.userId === player.userId).length);
            }, 0);
            score += playerVotes * 3;
            if (player.team === 'saboteur') {
                if (player.isAlive) {
                    score += 15;
                }
                if (winningTeam === 'saboteur') {
                    score += 20;
                }
            }
            player.score = score;
        }
    }
};
exports.EngineService = EngineService;
exports.EngineService = EngineService = EngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => games_service_1.GamesService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        ai_service_1.AiService,
        scenarios_service_1.ScenariosService,
        games_service_1.GamesService])
], EngineService);
//# sourceMappingURL=engine.service.js.map