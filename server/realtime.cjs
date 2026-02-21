// ============================================================
// Concord — WebSocket Real-Time Events
// Granular event broadcasting (not full state sync)
// JWT-authenticated connections with presence tracking
// ============================================================

const { WebSocketServer } = require('ws');
const { verifyAccessToken } = require('./auth.cjs');

function createRealtimeServer(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 }); // 1MB max

  // Track: ws → { userId, displayName, workspaceIds }
  const clients = new Map();

  // Handle HTTP → WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    // Extract token from query string: ws://host?token=xxx
    const url = new URL(request.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = payload.sub;
      ws.displayName = payload.displayName || payload.email;
      wss.emit('connection', ws, request);
    });
  });

  // ── Connection handler ──────────────────────────────────
  wss.on('connection', (ws) => {
    clients.set(ws, {
      userId: ws.userId,
      displayName: ws.displayName,
      subscribedWorkspaces: new Set(),
    });

    const clientCount = clients.size;
    console.log(`🔌 ${ws.displayName} conectou (${clientCount} online)`);

    // Send presence
    broadcastPresence();

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'subscribe': {
            // Subscribe to workspace events
            const client = clients.get(ws);
            if (client && msg.workspaceId) {
              client.subscribedWorkspaces.add(msg.workspaceId);
            }
            break;
          }

          case 'unsubscribe': {
            const client = clients.get(ws);
            if (client && msg.workspaceId) {
              client.subscribedWorkspaces.delete(msg.workspaceId);
            }
            break;
          }

          case 'typing': {
            // Relay typing indicator to all other clients
            broadcastToOthers(ws, {
              type: 'typing',
              channelId: msg.channelId,
              userId: ws.userId,
              displayName: ws.displayName,
              isTyping: msg.isTyping,
            });
            break;
          }

          case 'speaking': {
            broadcastToOthers(ws, {
              type: 'speaking',
              userId: ws.userId,
              speaking: msg.speaking,
            });
            break;
          }

          case 'voice:join':
          case 'voice:leave':
          case 'voice:mute':
          case 'voice:deafen': {
            broadcastToOthers(ws, { ...msg, userId: ws.userId });
            break;
          }

          default:
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      console.log(`👋 ${ws.displayName || ws.userId} desconectou (${clients.size - 1} online)`);
      clients.delete(ws);
      broadcastPresence();
      // Broadcast voice leave
      broadcastToAll({
        type: 'voice:leave',
        userId: ws.userId,
      });
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // ── Broadcasting helpers ────────────────────────────────
  function broadcastPresence() {
    const online = [];
    const seen = new Set();
    for (const client of clients.values()) {
      if (!seen.has(client.userId)) {
        online.push(client.userId);
        seen.add(client.userId);
      }
    }
    broadcastToAll({ type: 'presence', online });
  }

  function broadcastToAll(message) {
    const raw = JSON.stringify(message);
    for (const [ws] of clients) {
      if (ws.readyState === 1) {
        try { ws.send(raw); } catch { /* ignore */ }
      }
    }
  }

  function broadcastToOthers(sender, message) {
    const raw = JSON.stringify(message);
    for (const [ws] of clients) {
      if (ws !== sender && ws.readyState === 1) {
        try { ws.send(raw); } catch { /* ignore */ }
      }
    }
  }

  // This function is called by the API routes to broadcast data events
  function broadcastEvent(senderUserId, event) {
    const raw = JSON.stringify(event);
    for (const [ws, client] of clients) {
      if (client.userId !== senderUserId && ws.readyState === 1) {
        try { ws.send(raw); } catch { /* ignore */ }
      }
    }
  }

  return { wss, broadcastEvent, clients };
}

module.exports = { createRealtimeServer };
