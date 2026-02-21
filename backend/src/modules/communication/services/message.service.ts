import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { SendMessageDto, UpdateMessageDto } from '../dto/communication.dto';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async send(channelId: string, authorId: string, dto: SendMessageDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, serverId: true, server: { select: { tenantId: true } } },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    const message = await this.prisma.message.create({
      data: {
        channelId,
        authorId,
        content: dto.content,
        type: (dto.type as any) || 'TEXT',
        attachments: dto.attachments,
      },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        reactions: true,
      },
    });

    // Publish to Redis for real-time delivery
    await this.redisService.publish(
      `channel:${channelId}:messages`,
      JSON.stringify({
        event: 'message:new',
        data: message,
        tenantId: channel.server.tenantId,
      }),
    );

    return message;
  }

  async getMessages(channelId: string, before?: string, limit = 50) {
    const where: any = { channelId };

    if (before) {
      const cursor = await this.prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (cursor) {
        where.createdAt = { lt: cursor.createdAt };
      }
    }

    const messages = await this.prisma.message.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
        },
        mentions: true,
      },
    });

    return messages.reverse(); // Return in chronological order
  }

  async update(messageId: string, authorId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true, channelId: true },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        editedAt: new Date(),
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: true,
      },
    });

    await this.redisService.publish(
      `channel:${message.channelId}:messages`,
      JSON.stringify({ event: 'message:update', data: updated }),
    );

    return updated;
  }

  async delete(messageId: string, authorId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true, channelId: true },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({ where: { id: messageId } });

    await this.redisService.publish(
      `channel:${message.channelId}:messages`,
      JSON.stringify({ event: 'message:delete', data: { id: messageId } }),
    );

    return { deleted: true };
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const existing = await this.prisma.reaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      // Toggle off
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { action: 'removed', emoji };
    }

    await this.prisma.reaction.create({
      data: { messageId, userId, emoji },
    });

    return { action: 'added', emoji };
  }

  async togglePin(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { isPinned: true },
    });
    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
    });
  }

  async getPinnedMessages(channelId: string) {
    return this.prisma.message.findMany({
      where: { channelId, isPinned: true },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(channelId: string, query: string, limit = 20) {
    return this.prisma.message.findMany({
      where: {
        channelId,
        content: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }
}
