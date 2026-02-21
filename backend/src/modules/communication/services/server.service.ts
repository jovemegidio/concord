import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateServerDto } from '../dto/communication.dto';

@Injectable()
export class ServerService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateServerDto) {
    return this.prisma.server.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        iconUrl: dto.iconUrl,
        channels: {
          create: [
            { name: 'general', type: 'TEXT', position: 0 },
            { name: 'random', type: 'TEXT', position: 1 },
          ],
        },
      },
      include: {
        channels: { orderBy: { position: 'asc' } },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.server.findMany({
      where: { tenantId },
      include: {
        channels: {
          orderBy: { position: 'asc' },
          select: { id: true, name: true, type: true, isPrivate: true, position: true },
        },
        _count: { select: { channels: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(serverId: string, tenantId: string) {
    const server = await this.prisma.server.findFirst({
      where: { id: serverId, tenantId },
      include: {
        channels: {
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { messages: true } },
          },
        },
      },
    });

    if (!server) throw new NotFoundException('Server not found');
    return server;
  }

  async update(serverId: string, tenantId: string, data: Partial<CreateServerDto>) {
    await this.ensureServerExists(serverId, tenantId);
    return this.prisma.server.update({
      where: { id: serverId },
      data,
    });
  }

  async delete(serverId: string, tenantId: string) {
    await this.ensureServerExists(serverId, tenantId);
    return this.prisma.server.delete({ where: { id: serverId } });
  }

  private async ensureServerExists(serverId: string, tenantId: string) {
    const server = await this.prisma.server.findFirst({
      where: { id: serverId, tenantId },
    });
    if (!server) throw new NotFoundException('Server not found');
    return server;
  }
}
