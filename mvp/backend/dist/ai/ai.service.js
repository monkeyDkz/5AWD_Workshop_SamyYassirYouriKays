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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
let AiService = AiService_1 = class AiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.provider =
            this.configService.get('AI_PROVIDER') || 'anthropic';
        if (this.provider === 'openai') {
            const apiKey = this.configService.get('OPENAI_API_KEY');
            if (!apiKey) {
                this.logger.warn('OPENAI_API_KEY not set — AI features will use fallback responses');
            }
            this.openai = new openai_1.default({ apiKey: apiKey || 'missing-key' });
            this.model = this.configService.get('OPENAI_MODEL', 'gpt-4o');
        }
        else {
            const apiKey = this.configService.get('ANTHROPIC_API_KEY');
            if (!apiKey) {
                this.logger.warn('ANTHROPIC_API_KEY not set — AI features will use fallback responses');
            }
            this.anthropic = new sdk_1.default({ apiKey: apiKey || 'missing-key' });
            this.model = this.configService.get('AI_MODEL', 'claude-sonnet-4-5-20250929');
        }
        this.logger.log(`AI Service initialized — provider: ${this.provider}, model: ${this.model}`);
    }
    async chat(system, user, maxTokens) {
        if (this.provider === 'openai' && this.openai) {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                max_tokens: maxTokens,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
            });
            return response.choices[0]?.message?.content || '';
        }
        const response = await this.anthropic.messages.create({
            model: this.model,
            max_tokens: maxTokens,
            system,
            messages: [{ role: 'user', content: user }],
        });
        const textBlock = response.content.find((block) => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            return '';
        }
        return textBlock.text;
    }
    async narrate(systemPrompt, userPrompt, context) {
        try {
            const userContent = context
                ? `${userPrompt}\n\nContexte actuel:\n${context}`
                : userPrompt;
            const text = await this.chat(systemPrompt, userContent, 1500);
            if (!text) {
                this.logger.warn('AI response was empty');
                return AiService_1.FALLBACK_NARRATION;
            }
            return text;
        }
        catch (error) {
            this.logger.error(`AI narration error: ${error.message}`);
            if (error.status === 429) {
                this.logger.warn('AI rate limit reached, using fallback');
            }
            else if (error.code === 'ECONNABORTED' || error.name === 'TimeoutError') {
                this.logger.warn('AI request timed out, using fallback');
            }
            return AiService_1.FALLBACK_NARRATION;
        }
    }
    async *streamNarrate(systemPrompt, userPrompt, context) {
        try {
            const userContent = context
                ? `${userPrompt}\n\nContexte actuel:\n${context}`
                : userPrompt;
            if (this.provider === 'openai' && this.openai) {
                const stream = await this.openai.chat.completions.create({
                    model: this.model,
                    max_tokens: 1500,
                    stream: true,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userContent },
                    ],
                });
                for await (const chunk of stream) {
                    const delta = chunk.choices[0]?.delta?.content;
                    if (delta) {
                        yield delta;
                    }
                }
                return;
            }
            const stream = this.anthropic.messages.stream({
                model: this.model,
                max_tokens: 1500,
                system: systemPrompt,
                messages: [{ role: 'user', content: userContent }],
            });
            for await (const event of stream) {
                if (event.type === 'content_block_delta' &&
                    event.delta.type === 'text_delta') {
                    yield event.delta.text;
                }
            }
        }
        catch (error) {
            this.logger.error(`AI stream narration error: ${error.message}`);
            yield AiService_1.FALLBACK_NARRATION;
        }
    }
    async generateActionSuggestions(scenario, gameState, playerRole) {
        try {
            const systemPrompt = 'Tu es un assistant de jeu narratif. Tu generes des suggestions d\'actions pour les joueurs. Reponds UNIQUEMENT avec un tableau JSON de 3 a 4 strings, sans explication supplementaire.';
            const userPrompt = `Scenario: ${scenario.name}
Role du joueur: ${playerRole}
Round: ${gameState.currentRound}/${gameState.maxRounds}
Phase actuelle: ${gameState.currentPhase}
Jauges globales: ${JSON.stringify(gameState.globalGauges)}
Joueurs en vie: ${gameState.players.filter((p) => p.isAlive).map((p) => p.username).join(', ')}

Genere 3 a 4 actions contextuelles que ce joueur pourrait faire. Les actions doivent etre variees (prudentes, audacieuses, sociales, strategiques).
Reponds UNIQUEMENT avec un tableau JSON de strings. Exemple: ["Action 1", "Action 2", "Action 3"]`;
            const text = await this.chat(systemPrompt, userPrompt, 500);
            if (!text) {
                return AiService_1.FALLBACK_ACTIONS;
            }
            const jsonMatch = text.trim().match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
                    return parsed;
                }
            }
            this.logger.warn('Failed to parse AI action suggestions, using fallback');
            return AiService_1.FALLBACK_ACTIONS;
        }
        catch (error) {
            this.logger.error(`AI action suggestions error: ${error.message}`);
            return AiService_1.FALLBACK_ACTIONS;
        }
    }
    async resolveActions(scenario, gameState, actions) {
        try {
            const systemPrompt = `${scenario.aiPrompt.systemPrompt}

Tu dois aussi determiner les consequences mecaniques des actions des joueurs.
Reponds avec un objet JSON contenant:
- "narrative": un texte narratif (2-3 paragraphes) decrivant les consequences
- "stateChanges": un objet avec:
  - "globalGauges": objet avec les CHANGEMENTS (deltas) des jauges globales (ex: {"pression": -5, "oxygene": -3})
  - "playerGauges": objet ou chaque cle est un userId avec les changements de jauges (ex: {"userId1": {"suspicion": +10}})
  - "eliminations": tableau de userIds des joueurs elimines ce round (tableau vide si aucun)

IMPORTANT: Reponds UNIQUEMENT avec le JSON, sans texte supplementaire.`;
            const playersInfo = gameState.players
                .filter((p) => p.isAlive)
                .map((p) => `- ${p.username} (${p.role}, equipe: ${p.team}): jauges ${JSON.stringify(p.gauges)}`)
                .join('\n');
            const actionsInfo = actions
                .map((a) => {
                const player = gameState.players.find((p) => p.userId === a.userId);
                return `- ${player?.username || a.userId} (${player?.role || 'inconnu'}): "${a.action}"`;
            })
                .join('\n');
            const votesInfo = gameState.rounds?.[gameState.currentRound - 1]?.votes
                ?.map((v) => {
                const voter = gameState.players.find((p) => p.userId === v.userId);
                const target = gameState.players.find((p) => p.userId === v.targetId);
                return `- ${voter?.username || v.userId} vote contre ${target?.username || v.targetId}`;
            })
                .join('\n') || 'Aucun vote';
            const userPrompt = `Round ${gameState.currentRound}/${gameState.maxRounds}
Jauges globales: ${JSON.stringify(gameState.globalGauges)}

Joueurs en vie:
${playersInfo}

Actions de ce round:
${actionsInfo}

Votes de ce round:
${votesInfo}

Determine les consequences narratives et mecaniques. Sois equilibre mais cree de la tension.`;
            const text = await this.chat(systemPrompt, userPrompt, 2000);
            if (!text) {
                return this.fallbackResolution();
            }
            const jsonMatch = text.trim().match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    narrative: parsed.narrative || 'Les evenements se deroulent de maniere inattendue...',
                    stateChanges: {
                        globalGauges: parsed.stateChanges?.globalGauges || {},
                        playerGauges: parsed.stateChanges?.playerGauges || {},
                        eliminations: parsed.stateChanges?.eliminations || [],
                    },
                };
            }
            this.logger.warn('Failed to parse AI resolution response');
            return this.fallbackResolution();
        }
        catch (error) {
            this.logger.error(`AI resolve actions error: ${error.message}`);
            return this.fallbackResolution();
        }
    }
    async generateEpilogue(scenario, gameState, result) {
        try {
            let epiloguePrompt = scenario.aiPrompt.epiloguePrompt
                .replace('{result}', result)
                .replace('{verdict}', result);
            const saboteur = gameState.players.find((p) => p.team === 'saboteur');
            if (saboteur) {
                epiloguePrompt = epiloguePrompt.replace('{saboteur}', saboteur.username);
            }
            const context = this.buildStateContext(gameState);
            return await this.narrate(scenario.aiPrompt.systemPrompt, epiloguePrompt, context);
        }
        catch (error) {
            this.logger.error(`AI epilogue generation error: ${error.message}`);
            return `La partie est terminee. Resultat: ${result}. Merci d'avoir joue!`;
        }
    }
    buildStateContext(gameState) {
        const lines = [];
        lines.push(`Partie: ${gameState.gameId}`);
        lines.push(`Round: ${gameState.currentRound}/${gameState.maxRounds}`);
        lines.push(`Jauges globales: ${JSON.stringify(gameState.globalGauges)}`);
        lines.push('');
        lines.push('Joueurs:');
        for (const player of gameState.players) {
            const status = player.isAlive ? 'en vie' : 'elimine';
            lines.push(`- ${player.username} (${player.role}, ${player.team}) [${status}] - jauges: ${JSON.stringify(player.gauges)}`);
        }
        if (gameState.rounds && gameState.rounds.length > 0) {
            lines.push('');
            lines.push('Historique recent:');
            const recentRounds = gameState.rounds.slice(-2);
            for (const round of recentRounds) {
                lines.push(`  Round ${round.round}: ${round.narration || '(pas de narration)'}`);
                if (round.resolution) {
                    lines.push(`  Resolution: ${round.resolution.narrative || ''}`);
                    if (round.resolution.eliminations?.length > 0) {
                        lines.push(`  Eliminations: ${round.resolution.eliminations.join(', ')}`);
                    }
                }
            }
        }
        return lines.join('\n');
    }
    fallbackResolution() {
        return {
            narrative: 'Les evenements prennent une tournure inattendue. La tension monte parmi les joueurs, mais la situation reste incertaine...',
            stateChanges: {
                globalGauges: {},
                playerGauges: {},
                eliminations: [],
            },
        };
    }
};
exports.AiService = AiService;
AiService.FALLBACK_NARRATION = "Le Maitre du Jeu reflechit... (L'IA est momentanement indisponible, la partie continue.)";
AiService.FALLBACK_ACTIONS = [
    'Observer la situation attentivement',
    'Parler aux autres joueurs',
    'Agir prudemment',
    'Attendre et voir',
];
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map