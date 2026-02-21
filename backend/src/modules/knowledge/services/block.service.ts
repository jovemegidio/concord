import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateBlockDto, UpdateBlockDto, ReorderBlocksDto } from '../dto/knowledge.dto';

@Injectable()
export class BlockService {
  constructor(private prisma: PrismaService) {}

  async create(pageId: string, dto: CreateBlockDto) {
    const maxPos = await this.prisma.block.aggregate({
      where: { pageId, parentBlockId: dto.parentBlockId || null },
      _max: { position: true },
    });

    const block = await this.prisma.block.create({
      data: {
        pageId,
        type: dto.type as any,
        content: dto.content,
        properties: dto.properties || {},
        parentBlockId: dto.parentBlockId,
        position: dto.position ?? (maxPos._max.position ?? -1) + 1,
      },
      include: {
        children: { orderBy: { position: 'asc' } },
      },
    });

    // Update page's updatedAt
    await this.prisma.page.update({
      where: { id: pageId },
      data: { updatedAt: new Date() },
    });

    return block;
  }

  async update(blockId: string, dto: UpdateBlockDto) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: { pageId: true },
    });
    if (!block) throw new NotFoundException('Block not found');

    const updated = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        content: dto.content,
        properties: dto.properties,
        position: dto.position,
      },
      include: {
        children: { orderBy: { position: 'asc' } },
      },
    });

    // Update page's updatedAt
    await this.prisma.page.update({
      where: { id: block.pageId },
      data: { updatedAt: new Date() },
    });

    return updated;
  }

  async delete(blockId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: { pageId: true },
    });
    if (!block) throw new NotFoundException('Block not found');

    await this.prisma.block.delete({ where: { id: blockId } });

    // Update page's updatedAt
    await this.prisma.page.update({
      where: { id: block.pageId },
      data: { updatedAt: new Date() },
    });

    return { deleted: true };
  }

  async reorder(pageId: string, dto: ReorderBlocksDto) {
    const updates = dto.blockIds.map((id, index) =>
      this.prisma.block.update({
        where: { id },
        data: { position: index },
      }),
    );
    await this.prisma.$transaction(updates);

    await this.prisma.page.update({
      where: { id: pageId },
      data: { updatedAt: new Date() },
    });

    return { reordered: true };
  }

  async bulkUpdate(pageId: string, blocks: Array<{ id: string; content: any; position: number }>) {
    const updates = blocks.map((b) =>
      this.prisma.block.update({
        where: { id: b.id },
        data: {
          content: b.content,
          position: b.position,
        },
      }),
    );

    await this.prisma.$transaction(updates);

    await this.prisma.page.update({
      where: { id: pageId },
      data: { updatedAt: new Date() },
    });

    return { updated: blocks.length };
  }
}
