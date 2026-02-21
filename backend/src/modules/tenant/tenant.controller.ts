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
import { TenantService } from './tenant.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto/tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new organization' })
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateTenantDto) {
    return this.tenantService.create(user.sub, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List organizations I belong to' })
  async myTenants(@CurrentUser() user: UserPayload) {
    return this.tenantService.findUserTenants(user.sub);
  }

  @Get(':tenantId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Get organization details' })
  async findOne(@Param('tenantId') tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  @Put(':tenantId')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update organization' })
  async update(@Param('tenantId') tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(tenantId, dto);
  }

  @Get(':tenantId/members')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'List organization members' })
  async getMembers(@Param('tenantId') tenantId: string) {
    return this.tenantService.getMembers(tenantId);
  }

  @Post(':tenantId/members/invite')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Invite a member to the organization' })
  async invite(@Param('tenantId') tenantId: string, @Body() dto: InviteMemberDto) {
    return this.tenantService.inviteMember(tenantId, dto);
  }

  @Put(':tenantId/members/:userId/role')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update member role' })
  async updateRole(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.tenantService.updateMemberRole(tenantId, userId, dto.role);
  }

  @Delete(':tenantId/members/:userId')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Remove member from organization' })
  async removeMember(
    @CurrentUser() user: UserPayload,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.tenantService.removeMember(tenantId, userId, user.sub);
  }
}
