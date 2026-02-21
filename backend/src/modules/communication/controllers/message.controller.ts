import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessageService } from '../services/message.service';
import { SendMessageDto, UpdateMessageDto, AddReactionDto } from '../dto/communication.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentUser, UserPayload } from '../../../common/decorators/current-user.decorator';

@ApiTags('Communication - Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/channels/:channelId/messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to a channel' })
  async send(
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: SendMessageDto,
  ) {
    return this.messageService.send(channelId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get channel messages (paginated, cursor-based)' })
  async getMessages(
    @Param('channelId') channelId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: number,
  ) {
    return this.messageService.getMessages(channelId, before, limit);
  }

  @Put(':messageId')
  @ApiOperation({ summary: 'Edit a message (author only)' })
  async update(
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messageService.update(messageId, user.sub, dto);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message (author only)' })
  async delete(
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.messageService.delete(messageId, user.sub);
  }

  @Post(':messageId/reactions')
  @ApiOperation({ summary: 'Toggle reaction on a message' })
  async addReaction(
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: AddReactionDto,
  ) {
    return this.messageService.addReaction(messageId, user.sub, dto.emoji);
  }

  @Post(':messageId/pin')
  @ApiOperation({ summary: 'Toggle pin on a message' })
  async togglePin(@Param('messageId') messageId: string) {
    return this.messageService.togglePin(messageId);
  }

  @Get('pinned')
  @ApiOperation({ summary: 'Get pinned messages in channel' })
  async getPinned(@Param('channelId') channelId: string) {
    return this.messageService.getPinnedMessages(channelId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages in channel' })
  async search(
    @Param('channelId') channelId: string,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.messageService.search(channelId, query, limit);
  }
}
