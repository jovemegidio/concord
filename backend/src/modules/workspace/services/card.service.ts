import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import {
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  CreateChecklistDto,
  CreateChecklistItemDto,
  AddCommentDto,
} from '../dto/workspace.dto';

@Injectable()
export class CardService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(columnId: string, dto: CreateCardDto) {
    const maxPos = await this.prisma.card.aggregate({
      where: { columnId },
      _max: { position: true },
    });

    return this.prisma.card.create({
      data: {
        columnId,
        title: dto.title,
        description: dto.description,
        priority: (dto.priority as any) || 'NONE',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        labels: { include: { label: true } },
        checklists: { include: { items: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    });
  }

  async findById(cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: { board: { select: { id: true, name: true } } },
        },
        assignments: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        labels: { include: { label: true } },
        checklists: {
          orderBy: { position: 'asc' },
          include: { items: { orderBy: { position: 'asc' } } },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        attachments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!card) throw new NotFoundException('Card not found');
    return card;
  }

  async update(cardId: string, userId: string, dto: UpdateCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: { title: true, description: true, priority: true },
    });
    if (!card) throw new NotFoundException('Card not found');

    // Create history entries for changed fields
    const historyEntries: any[] = [];
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && (card as any)[key] !== value) {
        historyEntries.push({
          cardId,
          action: 'UPDATE',
          field: key,
          oldValue: String((card as any)[key] ?? ''),
          newValue: String(value),
          userId,
        });
      }
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.card.update({
        where: { id: cardId },
        data: {
          ...dto,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          priority: dto.priority as any,
        },
        include: {
          assignments: {
            include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
          },
          labels: { include: { label: true } },
        },
      }),
      ...(historyEntries.length > 0
        ? [this.prisma.cardHistory.createMany({ data: historyEntries })]
        : []),
    ]);

    return updated;
  }

  async move(cardId: string, userId: string, dto: MoveCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: { columnId: true, column: { select: { name: true } } },
    });
    if (!card) throw new NotFoundException('Card not found');

    const targetColumn = await this.prisma.boardColumn.findUnique({
      where: { id: dto.targetColumnId },
      select: { name: true },
    });

    await this.prisma.$transaction([
      this.prisma.card.update({
        where: { id: cardId },
        data: {
          columnId: dto.targetColumnId,
          position: dto.position,
        },
      }),
      this.prisma.cardHistory.create({
        data: {
          cardId,
          action: 'MOVE',
          field: 'column',
          oldValue: card.column.name,
          newValue: targetColumn?.name || dto.targetColumnId,
          userId,
        },
      }),
    ]);

    return { moved: true };
  }

  async delete(cardId: string) {
    return this.prisma.card.delete({ where: { id: cardId } });
  }

  // ─── Assignments ───

  async assign(cardId: string, userId: string) {
    return this.prisma.cardAssignment.create({
      data: { cardId, userId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async unassign(cardId: string, userId: string) {
    return this.prisma.cardAssignment.delete({
      where: { cardId_userId: { cardId, userId } },
    });
  }

  // ─── Checklists ───

  async createChecklist(cardId: string, dto: CreateChecklistDto) {
    const maxPos = await this.prisma.checklist.aggregate({
      where: { cardId },
      _max: { position: true },
    });

    return this.prisma.checklist.create({
      data: {
        cardId,
        title: dto.title,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: { items: true },
    });
  }

  async createChecklistItem(checklistId: string, dto: CreateChecklistItemDto) {
    const maxPos = await this.prisma.checklistItem.aggregate({
      where: { checklistId },
      _max: { position: true },
    });

    return this.prisma.checklistItem.create({
      data: {
        checklistId,
        title: dto.title,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  async toggleChecklistItem(itemId: string) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
      select: { isCompleted: true },
    });
    if (!item) throw new NotFoundException('Checklist item not found');

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: { isCompleted: !item.isCompleted },
    });
  }

  // ─── Comments ───

  async addComment(cardId: string, authorId: string, dto: AddCommentDto) {
    return this.prisma.cardComment.create({
      data: {
        cardId,
        authorId,
        content: dto.content,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async deleteComment(commentId: string) {
    return this.prisma.cardComment.delete({ where: { id: commentId } });
  }

  // ─── Labels ───

  async addLabel(cardId: string, labelId: string) {
    return this.prisma.cardLabel.create({
      data: { cardId, labelId },
    });
  }

  async removeLabel(cardId: string, labelId: string) {
    return this.prisma.cardLabel.delete({
      where: { cardId_labelId: { cardId, labelId } },
    });
  }
}
