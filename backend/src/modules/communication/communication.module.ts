import { Module } from '@nestjs/common';
import { ServerController } from './controllers/server.controller';
import { ChannelController } from './controllers/channel.controller';
import { MessageController } from './controllers/message.controller';
import { ServerService } from './services/server.service';
import { ChannelService } from './services/channel.service';
import { MessageService } from './services/message.service';
import { CommunicationGateway } from './gateway/communication.gateway';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Module({
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
