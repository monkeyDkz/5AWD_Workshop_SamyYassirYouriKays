import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private readonly configService;
    private readonly logger;
    private readonly provider;
    private readonly anthropic?;
    private readonly openai?;
    private readonly model;
    private static readonly FALLBACK_NARRATION;
    private static readonly FALLBACK_ACTIONS;
    constructor(configService: ConfigService);
    private chat;
    narrate(systemPrompt: string, userPrompt: string, context?: string): Promise<string>;
    streamNarrate(systemPrompt: string, userPrompt: string, context?: string): AsyncGenerator<string>;
    generateActionSuggestions(scenario: any, gameState: any, playerRole: string): Promise<string[]>;
    resolveActions(scenario: any, gameState: any, actions: any[]): Promise<{
        narrative: string;
        stateChanges: any;
    }>;
    generateEpilogue(scenario: any, gameState: any, result: string): Promise<string>;
    private buildStateContext;
    private fallbackResolution;
}
