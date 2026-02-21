import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BlockService } from '../services/block.service';
import { CreateBlockDto, UpdateBlockDto, ReorderBlocksDto } from '../dto/knowledge.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@ApiTags('Knowledge - Blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/pages/:pageId/blocks')
export class BlockController {
  constructor(private blockService: BlockService) {}

  @Post()
  @ApiOperation({ summary: 'Add block to page' })
  async create(@Param('pageId') pageId: string, @Body() dto: CreateBlockDto) {
    return this.blockService.create(pageId, dto);
  }

  // Static routes MUST come before parametric routes to avoid conflicts
  @Put('reorder')
  @ApiOperation({ summary: 'Reorder blocks on page' })
  async reorder(@Param('pageId') pageId: string, @Body() dto: ReorderBlocksDto) {
    return this.blockService.reorder(pageId, dto);
  }

  @Put('bulk')
  @ApiOperation({ summary: 'Bulk update blocks' })
  async bulkUpdate(
    @Param('pageId') pageId: string,
    @Body() blocks: Array<{ id: string; content: any; position: number }>,
  ) {
    return this.blockService.bulkUpdate(pageId, blocks);
  }

  @Put(':blockId')
  @ApiOperation({ summary: 'Update block content' })
  async update(@Param('blockId') blockId: string, @Body() dto: UpdateBlockDto) {
    return this.blockService.update(blockId, dto);
  }

  @Delete(':blockId')
  @ApiOperation({ summary: 'Delete block' })
  async delete(@Param('blockId') blockId: string) {
    return this.blockService.delete(blockId);
  }
}
