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
import { ServerService } from '../services/server.service';
import { CreateServerDto } from '../dto/communication.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { TenantId } from '../../../common/decorators/tenant.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Communication - Servers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/servers')
export class ServerController {
  constructor(private serverService: ServerService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a communication server' })
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateServerDto) {
    return this.serverService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all servers in tenant' })
  async findAll(@Param('tenantId') tenantId: string) {
    return this.serverService.findAll(tenantId);
  }

  @Get(':serverId')
  @ApiOperation({ summary: 'Get server details with channels' })
  async findOne(@Param('serverId') serverId: string, @Param('tenantId') tenantId: string) {
    return this.serverService.findById(serverId, tenantId);
  }

  @Put(':serverId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update server' })
  async update(
    @Param('serverId') serverId: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: Partial<CreateServerDto>,
  ) {
    return this.serverService.update(serverId, tenantId, dto);
  }

  @Delete(':serverId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete server and all channels' })
  async delete(@Param('serverId') serverId: string, @Param('tenantId') tenantId: string) {
    return this.serverService.delete(serverId, tenantId);
  }
}
