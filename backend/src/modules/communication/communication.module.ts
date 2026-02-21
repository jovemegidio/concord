import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ServerController } from './controllers/server.controller';
import { ChannelController } from './controllers/channel.controller';
import { MessageController } from './controllers/message.controller';
import { ServerService } from './services/server.service';
import { ChannelService } from './services/channel.service';
import { MessageService } from './services/message.service';
import { CommunicationGateway } from './gateway/communication.gateway';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [ServerController, ChannelController, MessageController],
  providers: [
    ServerService,
    ChannelService,
    MessageService,
    CommunicationGateway,
    TenantGuard,
  ],
  exports: [CommunicationGateway, MessageService],
})
export class CommunicationModule {}
