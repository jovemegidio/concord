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
import { CardService } from '../services/card.service';
import {
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  CreateChecklistDto,
  CreateChecklistItemDto,
  AddCommentDto,
} from '../dto/workspace.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CurrentUser, UserPayload } from '../../../common/decorators/current-user.decorator';

@ApiTags('Workspace - Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/columns/:columnId/cards')
export class CardController {
  constructor(private cardService: CardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new card' })
  async create(@Param('columnId') columnId: string, @Body() dto: CreateCardDto) {
    return this.cardService.create(columnId, dto);
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Get card details' })
  async findOne(@Param('cardId') cardId: string) {
    return this.cardService.findById(cardId);
  }

  @Put(':cardId')
  @ApiOperation({ summary: 'Update card' })
  async update(
    @Param('cardId') cardId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardService.update(cardId, user.sub, dto);
  }

  @Put(':cardId/move')
  @ApiOperation({ summary: 'Move card to another column' })
  async move(
    @Param('cardId') cardId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: MoveCardDto,
  ) {
    return this.cardService.move(cardId, user.sub, dto);
  }

  @Delete(':cardId')
  @ApiOperation({ summary: 'Delete card' })
  async delete(@Param('cardId') cardId: string) {
    return this.cardService.delete(cardId);
  }

  // ─── Assignments ───

  @Post(':cardId/assign/:userId')
  @ApiOperation({ summary: 'Assign user to card' })
  async assign(@Param('cardId') cardId: string, @Param('userId') userId: string) {
    return this.cardService.assign(cardId, userId);
  }

  @Delete(':cardId/assign/:userId')
  @ApiOperation({ summary: 'Unassign user from card' })
  async unassign(@Param('cardId') cardId: string, @Param('userId') userId: string) {
    return this.cardService.unassign(cardId, userId);
  }

  // ─── Checklists ───

  @Post(':cardId/checklists')
  @ApiOperation({ summary: 'Add checklist to card' })
  async createChecklist(@Param('cardId') cardId: string, @Body() dto: CreateChecklistDto) {
    return this.cardService.createChecklist(cardId, dto);
  }

  @Post(':cardId/checklists/:checklistId/items')
  @ApiOperation({ summary: 'Add item to checklist' })
  async createChecklistItem(
    @Param('checklistId') checklistId: string,
    @Body() dto: CreateChecklistItemDto,
  ) {
    return this.cardService.createChecklistItem(checklistId, dto);
  }

  @Put(':cardId/checklists/:checklistId/items/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle checklist item' })
  async toggleItem(@Param('itemId') itemId: string) {
    return this.cardService.toggleChecklistItem(itemId);
  }

  // ─── Comments ───

  @Post(':cardId/comments')
  @ApiOperation({ summary: 'Add comment to card' })
  async addComment(
    @Param('cardId') cardId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: AddCommentDto,
  ) {
    return this.cardService.addComment(cardId, user.sub, dto);
  }

  @Delete(':cardId/comments/:commentId')
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(@Param('commentId') commentId: string) {
    return this.cardService.deleteComment(commentId);
  }

  // ─── Labels ───

  @Post(':cardId/labels/:labelId')
  @ApiOperation({ summary: 'Add label to card' })
  async addLabel(@Param('cardId') cardId: string, @Param('labelId') labelId: string) {
    return this.cardService.addLabel(cardId, labelId);
  }

  @Delete(':cardId/labels/:labelId')
  @ApiOperation({ summary: 'Remove label from card' })
  async removeLabel(@Param('cardId') cardId: string, @Param('labelId') labelId: string) {
    return this.cardService.removeLabel(cardId, labelId);
  }
}
