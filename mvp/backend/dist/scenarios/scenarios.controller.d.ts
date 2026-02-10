import { ScenariosService } from './scenarios.service';
export declare class ScenariosController {
    private readonly scenariosService;
    constructor(scenariosService: ScenariosService);
    getAllScenarios(): import("./interfaces/scenario.interface").ScenarioMetadata[];
    getScenario(slug: string): import("./interfaces/scenario.interface").ScenarioPack;
}
