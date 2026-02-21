import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateChannelDto } from '../dto/communication.dto';

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  async create(serverId: string, tenantId: string, dto: CreateChannelDto) {
    // Verify server belongs to tenant
    const server = await this.prisma.server.findFirst({
      where: { id: serverId, tenantId },
    });
    if (!server) throw new NotFoundException('Server not found');

    // Get max position
    const maxPos = await this.prisma.channel.aggregate({
      where: { serverId },
      _max: { position: true },
    });

    return this.prisma.channel.create({
      data: {
        serverId,
        name: dto.name.toLowerCase().replace(/\s+/g, '-'),
        topic: dto.topic,
        type: (dto.type as any) || 'TEXT',
        isPrivate: dto.isPrivate || false,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  async findByServer(serverId: string) {
    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { messages: true } },
      },
    });
  }

  async findById(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: { select: { id: true, name: true, tenantId: true } },
        permissions: true,
      },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async update(channelId: string, data: Partial<CreateChannelDto>) {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.name = data.name.toLowerCase().replace(/\s+/g, '-');
    }
    return this.prisma.channel.update({
      where: { id: channelId },
      data: updateData,
    });
  }

  async delete(channelId: string) {
    return this.prisma.channel.delete({ where: { id: channelId } });
  }

  async reorder(serverId: string, channelIds: string[]) {
    const updates = channelIds.map((id, index) =>
      this.prisma.channel.update({
        where: { id },
        data: { position: index },
      }),
    );
    return this.prisma.$transaction(updates);
  }
}
