"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenariosService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
let ScenariosService = class ScenariosService {
    constructor() {
        this.scenarios = new Map();
    }
    onModuleInit() {
        this.loadScenarioPacks();
    }
    loadScenarioPacks() {
        const packsDir = (0, path_1.join)(__dirname, 'packs');
        const packFiles = ['tribunal.json', 'deep.json'];
        for (const file of packFiles) {
            const filePath = (0, path_1.join)(packsDir, file);
            const raw = (0, fs_1.readFileSync)(filePath, 'utf-8');
            const pack = JSON.parse(raw);
            this.scenarios.set(pack.slug, pack);
        }
    }
    getAllScenarios() {
        const result = [];
        for (const pack of this.scenarios.values()) {
            result.push({
                slug: pack.slug,
                name: pack.name,
                description: pack.description,
                minPlayers: pack.minPlayers,
                maxPlayers: pack.maxPlayers,
                duration: pack.duration,
                difficulty: pack.difficulty,
                roles: pack.roles.map((r) => ({
                    id: r.id,
                    name: r.name,
                    team: r.team,
                })),
            });
        }
        return result;
    }
    getScenario(slug) {
        const pack = this.scenarios.get(slug);
        if (!pack) {
            throw new common_1.NotFoundException(`Scenario "${slug}" not found`);
        }
        return pack;
    }
    getScenarioConfig(slug) {
        const pack = this.getScenario(slug);
        return {
            roles: pack.roles,
            phases: pack.phases,
            gauges: pack.gauges,
            winConditions: pack.winConditions,
            aiPrompt: pack.aiPrompt,
            maxRounds: pack.maxRounds,
        };
    }
    getRolesForPlayers(slug, playerCount) {
        const pack = this.getScenario(slug);
        if (playerCount < pack.minPlayers) {
            throw new common_1.NotFoundException(`Scenario "${slug}" requires at least ${pack.minPlayers} players`);
        }
        if (playerCount > pack.maxPlayers) {
            throw new common_1.NotFoundException(`Scenario "${slug}" allows at most ${pack.maxPlayers} players`);
        }
        const assignedRoles = [];
        const requiredRoles = pack.roles.filter((r) => r.required);
        for (const role of requiredRoles) {
            assignedRoles.push(role);
        }
        let remaining = playerCount - assignedRoles.length;
        const optionalUnique = pack.roles.filter((r) => !r.required && r.unique);
        const optionalNonUnique = pack.roles.filter((r) => !r.required && !r.unique);
        for (const role of optionalUnique) {
            if (remaining <= 0)
                break;
            assignedRoles.push(role);
            remaining--;
        }
        let nonUniqueIndex = 0;
        while (remaining > 0 && optionalNonUnique.length > 0) {
            assignedRoles.push(optionalNonUnique[nonUniqueIndex % optionalNonUnique.length]);
            nonUniqueIndex++;
            remaining--;
        }
        return assignedRoles;
    }
    scenarioExists(slug) {
        return this.scenarios.has(slug);
    }
};
exports.ScenariosService = ScenariosService;
exports.ScenariosService = ScenariosService = __decorate([
    (0, common_1.Injectable)()
], ScenariosService);
//# sourceMappingURL=scenarios.service.js.map