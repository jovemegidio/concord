import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChannelService } from '../services/channel.service';
import { CreateChannelDto } from '../dto/communication.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Communication - Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/servers/:serverId/channels')
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create a channel in a server' })
  async create(
    @Param('serverId') serverId: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelService.create(serverId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List channels in a server' })
  async findAll(@Param('serverId') serverId: string) {
    return this.channelService.findByServer(serverId);
  }

  @Get(':channelId')
  @ApiOperation({ summary: 'Get channel details' })
  async findOne(@Param('channelId') channelId: string) {
    return this.channelService.findById(channelId);
  }

  @Put(':channelId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Update channel' })
  async update(@Param('channelId') channelId: string, @Body() dto: Partial<CreateChannelDto>) {
    return this.channelService.update(channelId, dto);
  }

  @Delete(':channelId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete channel' })
  async delete(@Param('channelId') channelId: string) {
    return this.channelService.delete(channelId);
  }
}
