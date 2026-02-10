"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const ai_module_1 = require("../ai/ai.module");
const scenarios_module_1 = require("../scenarios/scenarios.module");
const games_module_1 = require("../games/games.module");
const cache_module_1 = require("../cache/cache.module");
const engine_service_1 = require("./engine.service");
let EngineModule = class EngineModule {
};
exports.EngineModule = EngineModule;
exports.EngineModule = EngineModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            ai_module_1.AiModule,
            scenarios_module_1.ScenariosModule,
            (0, common_1.forwardRef)(() => games_module_1.GamesModule),
            cache_module_1.CacheModule,
        ],
        providers: [engine_service_1.EngineService],
        exports: [engine_service_1.EngineService],
    })
], EngineModule);
//# sourceMappingURL=engine.module.js.map