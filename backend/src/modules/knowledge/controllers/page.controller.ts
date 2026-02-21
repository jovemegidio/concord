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
import { PageService } from '../services/page.service';
import { CreatePageDto, UpdatePageDto } from '../dto/knowledge.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentUser, UserPayload } from '../../../common/decorators/current-user.decorator';

@ApiTags('Knowledge - Pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/pages')
export class PageController {
  constructor(private pageService: PageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new page' })
  async create(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreatePageDto,
  ) {
    return this.pageService.create(tenantId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List root pages (or children of parentId)' })
  async findAll(
    @Param('tenantId') tenantId: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.pageService.findAll(tenantId, parentId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get full page tree' })
  async getTree(@Param('tenantId') tenantId: string) {
    return this.pageService.getTree(tenantId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite pages' })
  async getFavorites(@Param('tenantId') tenantId: string) {
    return this.pageService.getFavorites(tenantId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get page templates' })
  async getTemplates(@Param('tenantId') tenantId: string) {
    return this.pageService.getTemplates(tenantId);
  }

  @Get(':pageId')
  @ApiOperation({ summary: 'Get page with blocks' })
  async findOne(@Param('pageId') pageId: string, @Param('tenantId') tenantId: string) {
    return this.pageService.findById(pageId, tenantId);
  }

  @Put(':pageId')
  @ApiOperation({ summary: 'Update page metadata' })
  async update(
    @Param('pageId') pageId: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pageService.update(pageId, tenantId, dto);
  }

  @Delete(':pageId')
  @ApiOperation({ summary: 'Delete page' })
  async delete(@Param('pageId') pageId: string, @Param('tenantId') tenantId: string) {
    return this.pageService.delete(pageId, tenantId);
  }

  @Post(':pageId/version')
  @ApiOperation({ summary: 'Create a version snapshot' })
  async createVersion(
    @Param('pageId') pageId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.pageService.createVersion(pageId, user.sub);
  }

  @Post(':pageId/duplicate')
  @ApiOperation({ summary: 'Duplicate a page' })
  async duplicate(
    @Param('pageId') pageId: string,
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.pageService.duplicatePage(pageId, tenantId, user.sub);
  }
}
