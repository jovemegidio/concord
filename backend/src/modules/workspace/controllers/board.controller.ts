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
import { BoardService } from '../services/board.service';
import { ColumnService } from '../services/column.service';
import { CreateBoardDto, CreateColumnDto, ReorderColumnsDto } from '../dto/workspace.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@ApiTags('Workspace - Boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/boards')
export class BoardController {
  constructor(
    private boardService: BoardService,
    private columnService: ColumnService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateBoardDto) {
    return this.boardService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all boards' })
  async findAll(@Param('tenantId') tenantId: string) {
    return this.boardService.findAll(tenantId);
  }

  @Get(':boardId')
  @ApiOperation({ summary: 'Get board with columns and cards' })
  async findOne(@Param('boardId') boardId: string, @Param('tenantId') tenantId: string) {
    return this.boardService.findById(boardId, tenantId);
  }

  @Put(':boardId')
  @ApiOperation({ summary: 'Update board' })
  async update(
    @Param('boardId') boardId: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: Partial<CreateBoardDto>,
  ) {
    return this.boardService.update(boardId, tenantId, dto);
  }

  @Delete(':boardId')
  @ApiOperation({ summary: 'Delete board' })
  async delete(@Param('boardId') boardId: string, @Param('tenantId') tenantId: string) {
    return this.boardService.delete(boardId, tenantId);
  }

  // ─── Columns ───

  @Post(':boardId/columns')
  @ApiOperation({ summary: 'Add column to board' })
  async createColumn(@Param('boardId') boardId: string, @Body() dto: CreateColumnDto) {
    return this.columnService.create(boardId, dto);
  }

  @Put(':boardId/columns/:columnId')
  @ApiOperation({ summary: 'Update column' })
  async updateColumn(@Param('columnId') columnId: string, @Body() dto: Partial<CreateColumnDto>) {
    return this.columnService.update(columnId, dto);
  }

  @Delete(':boardId/columns/:columnId')
  @ApiOperation({ summary: 'Delete column' })
  async deleteColumn(@Param('columnId') columnId: string) {
    return this.columnService.delete(columnId);
  }

  @Put(':boardId/columns/reorder')
  @ApiOperation({ summary: 'Reorder columns' })
  async reorderColumns(@Param('boardId') boardId: string, @Body() dto: ReorderColumnsDto) {
    return this.columnService.reorder(boardId, dto);
  }
}
