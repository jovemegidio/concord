import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

interface SocketWithData extends Socket {
  userId?: string;
  tenantId?: string;
  displayName?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/communication',
})
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>(); // tenantId -> Set<userId>

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: SocketWithData) {
    try {
      // Extract and verify JWT from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Attach verified user info to socket
      client.userId = payload.sub;
      client.displayName = payload.displayName;

      console.log(`🔌 WS authenticated: ${client.id} (user: ${payload.displayName})`);
    } catch (err) {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: SocketWithData) {
    if (client.userId && client.tenantId) {
      // Remove from online users
      const tenantOnline = this.onlineUsers.get(client.tenantId);
      if (tenantOnline) {
        tenantOnline.delete(client.userId);
        if (tenantOnline.size === 0) {
          this.onlineUsers.delete(client.tenantId);
        }
      }

      // Notify tenant members
      this.server.to(`tenant:${client.tenantId}`).emit('user:offline', {
        userId: client.userId,
        displayName: client.displayName,
      });

      // Update DB status
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { status: 'OFFLINE', lastSeenAt: new Date() },
      }).catch(() => {});

      // Clean Redis
      await this.redisService.srem(`tenant:${client.tenantId}:online`, client.userId);
    }
    console.log(`🔌 WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('identify')
  async handleIdentify(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: { tenantId: string },
  ) {
    // userId and displayName come from JWT verification in handleConnection
    if (!client.userId) {
      return { status: 'error', message: 'Not authenticated' };
    }

    client.tenantId = data.tenantId;

    // Verify user belongs to this tenant
    const membership = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: { tenantId: data.tenantId, userId: client.userId },
      },
    });
    if (!membership) {
      client.emit('error', { message: 'You do not belong to this tenant' });
      client.disconnect();
      return;
    }

    // Join tenant room
    client.join(`tenant:${data.tenantId}`);

    // Track online status
    if (!this.onlineUsers.has(data.tenantId)) {
      this.onlineUsers.set(data.tenantId, new Set());
    }
    this.onlineUsers.get(data.tenantId)!.add(client.userId);

    // Redis for horizontal scaling
    await this.redisService.sadd(`tenant:${data.tenantId}:online`, client.userId);
    await this.redisService.set(`user:${client.userId}:status`, 'ONLINE', 86400);

    // Update DB
    await this.prisma.user.update({
      where: { id: client.userId },
      data: { status: 'ONLINE' },
    }).catch(() => {});

    // Notify others
    client.to(`tenant:${data.tenantId}`).emit('user:online', {
      userId: client.userId,
      displayName: client.displayName,
    });

    // Send online users list to the new client
    const onlineList = await this.redisService.smembers(`tenant:${data.tenantId}:online`);
    client.emit('users:online', onlineList);

    return { status: 'identified' };
  }

  @SubscribeMessage('channel:join')
  handleJoinChannel(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: { channelId: string },
  ) {
    client.join(`channel:${data.channelId}`);
    return { status: 'joined', channelId: data.channelId };
  }

  @SubscribeMessage('channel:leave')
  handleLeaveChannel(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`channel:${data.channelId}`);
    return { status: 'left', channelId: data.channelId };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: { channelId: string },
  ) {
    client.to(`channel:${data.channelId}`).emit('typing:start', {
      userId: client.userId,
      displayName: client.displayName,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: { channelId: string },
  ) {
    client.to(`channel:${data.channelId}`).emit('typing:stop', {
      userId: client.userId,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('voice:join')
  handleVoiceJoin(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: { channelId: string },
  ) {
    client.join(`voice:${data.channelId}`);
    client.to(`tenant:${client.tenantId}`).emit('voice:joined', {
      userId: client.userId,
      displayName: client.displayName,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('voice:leave')
  handleVoiceLeave(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`voice:${data.channelId}`);
    client.to(`tenant:${client.tenantId}`).emit('voice:left', {
      userId: client.userId,
      channelId: data.channelId,
    });
  }

  // Emit to a specific channel (called from services)
  emitToChannel(channelId: string, event: string, data: any) {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }

  // Emit to entire tenant (called from services)
  emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }
}
