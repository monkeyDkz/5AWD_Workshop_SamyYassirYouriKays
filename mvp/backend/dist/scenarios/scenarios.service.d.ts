import { OnModuleInit } from '@nestjs/common';
import { ScenarioPack, ScenarioMetadata, ScenarioConfig, ScenarioRole } from './interfaces/scenario.interface';
export declare class ScenariosService implements OnModuleInit {
    private scenarios;
    onModuleInit(): void;
    private loadScenarioPacks;
    getAllScenarios(): ScenarioMetadata[];
    getScenario(slug: string): ScenarioPack;
    getScenarioConfig(slug: string): ScenarioConfig;
    getRolesForPlayers(slug: string, playerCount: number): ScenarioRole[];
    scenarioExists(slug: string): boolean;
}
