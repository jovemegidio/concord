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
import { RedisService } from '../../infrastructure/redis/redis.service';

/**
 * Main WebSocket Gateway.
 * Handles board real-time updates and knowledge base collaboration.
 * Communication has its own dedicated gateway.
 */
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private redisService: RedisService) {}

  handleConnection(client: Socket) {
    console.log(`⚡ Realtime WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`⚡ Realtime WS disconnected: ${client.id}`);
  }

  // ─── Board Real-time ───

  @SubscribeMessage('board:join')
  handleBoardJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    client.join(`board:${data.boardId}`);
    return { status: 'joined' };
  }

  @SubscribeMessage('board:leave')
  handleBoardLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    client.leave(`board:${data.boardId}`);
  }

  @SubscribeMessage('board:card:moved')
  handleCardMoved(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; cardId: string; fromColumn: string; toColumn: string; position: number },
  ) {
    client.to(`board:${data.boardId}`).emit('board:card:moved', data);
  }

  @SubscribeMessage('board:card:created')
  handleCardCreated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; card: any },
  ) {
    client.to(`board:${data.boardId}`).emit('board:card:created', data);
  }

  @SubscribeMessage('board:card:updated')
  handleCardUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; card: any },
  ) {
    client.to(`board:${data.boardId}`).emit('board:card:updated', data);
  }

  @SubscribeMessage('board:card:deleted')
  handleCardDeleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; cardId: string },
  ) {
    client.to(`board:${data.boardId}`).emit('board:card:deleted', data);
  }

  // ─── Page Collaboration ───

  @SubscribeMessage('page:join')
  handlePageJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; userId: string; displayName: string },
  ) {
    client.join(`page:${data.pageId}`);
    client.to(`page:${data.pageId}`).emit('page:user:joined', {
      userId: data.userId,
      displayName: data.displayName,
    });
    return { status: 'joined' };
  }

  @SubscribeMessage('page:leave')
  handlePageLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; userId: string },
  ) {
    client.leave(`page:${data.pageId}`);
    client.to(`page:${data.pageId}`).emit('page:user:left', {
      userId: data.userId,
    });
  }

  @SubscribeMessage('page:block:updated')
  handleBlockUpdated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; blockId: string; content: any; userId: string },
  ) {
    client.to(`page:${data.pageId}`).emit('page:block:updated', data);
  }

  @SubscribeMessage('page:block:created')
  handleBlockCreated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; block: any },
  ) {
    client.to(`page:${data.pageId}`).emit('page:block:created', data);
  }

  @SubscribeMessage('page:block:deleted')
  handleBlockDeleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; blockId: string },
  ) {
    client.to(`page:${data.pageId}`).emit('page:block:deleted', data);
  }

  // ─── Emit helpers for services ───

  emitToBoardRoom(boardId: string, event: string, data: any) {
    this.server.to(`board:${boardId}`).emit(event, data);
  }

  emitToPageRoom(pageId: string, event: string, data: any) {
    this.server.to(`page:${pageId}`).emit(event, data);
  }
}
