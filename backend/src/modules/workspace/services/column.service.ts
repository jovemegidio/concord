import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateColumnDto, ReorderColumnsDto } from '../dto/workspace.dto';

@Injectable()
export class ColumnService {
  constructor(private prisma: PrismaService) {}

  async create(boardId: string, dto: CreateColumnDto) {
    const maxPos = await this.prisma.boardColumn.aggregate({
      where: { boardId },
      _max: { position: true },
    });

    return this.prisma.boardColumn.create({
      data: {
        boardId,
        name: dto.name,
        color: dto.color,
        wipLimit: dto.wipLimit,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: {
        cards: { orderBy: { position: 'asc' } },
      },
    });
  }

  async update(columnId: string, data: Partial<CreateColumnDto>) {
    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data,
    });
  }

  async delete(columnId: string) {
    return this.prisma.boardColumn.delete({ where: { id: columnId } });
  }

  async reorder(boardId: string, dto: ReorderColumnsDto) {
    const updates = dto.columnIds.map((id, index) =>
      this.prisma.boardColumn.update({
        where: { id },
        data: { position: index },
      }),
    );
    return this.prisma.$transaction(updates);
  }
}
