import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreatePageDto, UpdatePageDto } from '../dto/knowledge.dto';

@Injectable()
export class PageService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreatePageDto) {
    const maxPos = await this.prisma.page.aggregate({
      where: { tenantId, parentId: dto.parentId || null },
      _max: { position: true },
    });

    return this.prisma.page.create({
      data: {
        tenantId,
        title: dto.title,
        parentId: dto.parentId,
        icon: dto.icon,
        coverUrl: dto.coverUrl,
        isTemplate: dto.isTemplate || false,
        position: (maxPos._max.position ?? -1) + 1,
        createdBy: userId,
        blocks: {
          create: {
            type: 'PARAGRAPH',
            content: { text: '' },
            position: 0,
          },
        },
      },
      include: {
        blocks: { orderBy: { position: 'asc' } },
        children: { select: { id: true, title: true, icon: true } },
      },
    });
  }

  async findAll(tenantId: string, parentId?: string) {
    return this.prisma.page.findMany({
      where: {
        tenantId,
        parentId: parentId || null,
        isTemplate: false,
      },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        icon: true,
        isFavorite: true,
        isPublished: true,
        parentId: true,
        updatedAt: true,
        _count: { select: { children: true, blocks: true } },
      },
    });
  }

  async findById(pageId: string, tenantId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId },
      include: {
        blocks: {
          orderBy: { position: 'asc' },
          include: {
            children: { orderBy: { position: 'asc' } },
          },
        },
        children: {
          select: { id: true, title: true, icon: true, position: true },
          orderBy: { position: 'asc' },
        },
        parent: { select: { id: true, title: true, icon: true } },
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
          select: { id: true, version: true, createdAt: true, user: { select: { displayName: true } } },
        },
      },
    });

    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async getTree(tenantId: string) {
    // Get all pages for the tenant and build tree structure
    const pages = await this.prisma.page.findMany({
      where: { tenantId, isTemplate: false },
      select: {
        id: true,
        title: true,
        icon: true,
        parentId: true,
        isFavorite: true,
        position: true,
        _count: { select: { children: true } },
      },
      orderBy: { position: 'asc' },
    });

    return this.buildTree(pages);
  }

  async getFavorites(tenantId: string) {
    return this.prisma.page.findMany({
      where: { tenantId, isFavorite: true },
      select: {
        id: true,
        title: true,
        icon: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTemplates(tenantId: string) {
    return this.prisma.page.findMany({
      where: { tenantId, isTemplate: true },
      select: {
        id: true,
        title: true,
        icon: true,
        coverUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(pageId: string, tenantId: string, dto: UpdatePageDto) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId },
    });
    if (!page) throw new NotFoundException('Page not found');

    return this.prisma.page.update({
      where: { id: pageId },
      data: dto,
    });
  }

  async delete(pageId: string, tenantId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId },
    });
    if (!page) throw new NotFoundException('Page not found');

    // Cascade: re-parent children to this page's parent
    await this.prisma.page.updateMany({
      where: { parentId: pageId },
      data: { parentId: page.parentId },
    });

    return this.prisma.page.delete({ where: { id: pageId } });
  }

  async createVersion(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { blocks: true },
    });
    if (!page) throw new NotFoundException('Page not found');

    const lastVersion = await this.prisma.pageVersion.findFirst({
      where: { pageId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return this.prisma.pageVersion.create({
      data: {
        pageId,
        userId,
        version: (lastVersion?.version ?? 0) + 1,
        snapshot: {
          title: page.title,
          blocks: page.blocks,
        },
      },
    });
  }

  async duplicatePage(pageId: string, tenantId: string, userId: string) {
    const original = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId },
      include: { blocks: true },
    });
    if (!original) throw new NotFoundException('Page not found');

    return this.prisma.page.create({
      data: {
        tenantId,
        title: `${original.title} (copy)`,
        icon: original.icon,
        parentId: original.parentId,
        createdBy: userId,
        blocks: {
          create: original.blocks.map((b) => ({
            type: b.type,
            content: b.content as any,
            properties: b.properties as any,
            position: b.position,
          })),
        },
      },
      include: { blocks: true },
    });
  }

  // ─── Helpers ───

  private buildTree(pages: any[], parentId: string | null = null): any[] {
    return pages
      .filter((p) => p.parentId === parentId)
      .map((page) => ({
        ...page,
        children: this.buildTree(pages, page.id),
      }));
  }
}
