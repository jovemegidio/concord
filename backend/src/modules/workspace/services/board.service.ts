import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { CreateBoardDto } from '../dto/workspace.dto';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(tenantId: string, dto: CreateBoardDto) {
    // Ensure workspace exists for this tenant (auto-create if needed)
    let workspace = await this.prisma.workspace.findFirst({
      where: { tenantId },
    });

    if (!workspace) {
      workspace = await this.prisma.workspace.create({
        data: {
          tenantId,
          name: 'Default Workspace',
        },
      });
    }

    return this.prisma.board.create({
      data: {
        workspaceId: workspace.id,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        columns: {
          create: [
            { name: 'To Do', position: 0, color: '#6366f1' },
            { name: 'In Progress', position: 1, color: '#f59e0b' },
            { name: 'Done', position: 2, color: '#22c55e' },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: { orderBy: { position: 'asc' } },
          },
        },
        labels: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.board.findMany({
      where: {
        workspace: { tenantId },
        isClosed: false,
      },
      include: {
        _count: {
          select: {
            columns: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findById(boardId: string, tenantId: string) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        workspace: { tenantId },
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { isArchived: false },
              orderBy: { position: 'asc' },
              include: {
                assignments: {
                  include: {
                    user: { select: { id: true, displayName: true, avatarUrl: true } },
                  },
                },
                labels: {
                  include: { label: true },
                },
                checklists: {
                  include: {
                    items: { orderBy: { position: 'asc' } },
                  },
                },
                _count: {
                  select: { comments: true, attachments: true },
                },
              },
            },
          },
        },
        labels: true,
      },
    });

    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async update(boardId: string, tenantId: string, data: Partial<CreateBoardDto>) {
    const board = await this.prisma.board.findFirst({
      where: { id: boardId, workspace: { tenantId } },
    });
    if (!board) throw new NotFoundException('Board not found');

    return this.prisma.board.update({
      where: { id: boardId },
      data,
    });
  }

  async delete(boardId: string, tenantId: string) {
    const board = await this.prisma.board.findFirst({
      where: { id: boardId, workspace: { tenantId } },
    });
    if (!board) throw new NotFoundException('Board not found');

    return this.prisma.board.delete({ where: { id: boardId } });
  }
}
