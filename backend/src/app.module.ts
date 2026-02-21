import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AuditModule } from './modules/audit/audit.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Infrastructure
    PrismaModule,
    RedisModule,

    // Feature modules
    AuthModule,
    TenantModule,
    CommunicationModule,
    WorkspaceModule,
    KnowledgeModule,
    WebsocketModule,
    AuditModule,
  ],
  providers: [
    // Global audit interceptor — logs all mutations automatically
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');

    consumer
      .apply(TenantMiddleware)
      .exclude(
        'api/v1/auth/login',
        'api/v1/auth/register',
        'api/v1/auth/refresh',
        'api/v1/health',
      )
      .forRoutes('*');
  }
}
