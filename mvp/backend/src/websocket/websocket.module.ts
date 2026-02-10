import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';
import { GamesModule } from '../games/games.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [EngineModule, GamesModule, AuthModule, CacheModule],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
