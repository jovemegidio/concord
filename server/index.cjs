// ============================================================
// Concord — Real-Time Server
// WebSocket relay + Express static server + JSON persistence
// ============================================================

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ── Config ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const AUTO_TUNNEL = process.env.NO_TUNNEL !== '1' && !process.env.RENDER; // skip tunnel on cloud

// ── Persistence ─────────────────────────────────────────────
let sharedState = { chat: null, boards: null, pages: null };

try {
  if (fs.existsSync(DATA_FILE)) {
    sharedState = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log('📂 Estado carregado de data.json');
  }
} catch (err) {
  console.warn('⚠️  Erro ao carregar data.json, iniciando com estado vazio');
}

let persistTimer = null;
function persist() {
  // Debounce persists to avoid hammering the disk
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(sharedState));
    } catch (err) {
      console.error('❌ Erro ao salvar data.json:', err.message);
    }
  }, 200);
}

// Graceful shutdown — save state before exiting
function gracefulShutdown(signal) {
  console.log(`\n⚡ ${signal} recebido, salvando estado...`);
  if (persistTimer) clearTimeout(persistTimer);
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(sharedState));
    console.log('✅ Estado salvo com sucesso.');
  } catch (err) {
    console.error('❌ Falha ao salvar:', err.message);
  }
  process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Express (serve built frontend) ──────────────────────────
const app = express();
const server = http.createServer(app);

app.use(express.static(DIST_DIR));
app.get('*', (_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <html>
        <body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <h1>⚡ Concord Server</h1>
            <p>O servidor está rodando! Rode <code style="color:#818cf8">npm run build</code> para gerar o frontend.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// ── WebSocket Server ────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true, maxPayload: 10 * 1024 * 1024 }); // 10MB max

// Handle HTTP → WebSocket upgrade explicitly (required by some cloud platforms)
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Track connected users: Map<WebSocket, userId>
const connectedUsers = new Map();

function getOnlineUserIds() {
  const ids = new Set();
  for (const userId of connectedUsers.values()) {
    if (userId) ids.add(userId);
  }
  return [...ids];
}

function broadcastPresence() {
  const online = getOnlineUserIds();
  const msg = JSON.stringify({ type: 'presence', online });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

function broadcastToOthers(sender, message) {
  const raw = typeof message === 'string' ? message : JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === 1) {
      client.send(raw);
    }
  });
}

wss.on('connection', (ws) => {
  connectedUsers.set(ws, null);
  const clientCount = wss.clients.size;
  console.log(`🔌 Nova conexão (${clientCount} cliente(s) online)`);

  // Send current state snapshot
  ws.send(JSON.stringify({ type: 'init', state: sharedState }));

  // Send current online users
  ws.send(JSON.stringify({ type: 'presence', online: getOnlineUserIds() }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'identify': {
          // Client identifies which user they are
          connectedUsers.set(ws, msg.userId);
          console.log(`👤 ${msg.displayName || msg.userId} entrou`);
          broadcastPresence();
          break;
        }

        case 'sync': {
          // Client sends updated store state
          if (msg.store && msg.state) {
            sharedState[msg.store] = msg.state;
            persist();
            // Relay to all other clients
            broadcastToOthers(ws, {
              type: 'sync',
              store: msg.store,
              state: msg.state,
            });
          }
          break;
        }

        case 'speaking': {
          // Relay speaking indicator to others (not persisted to avoid disk spam)
          broadcastToOthers(ws, msg);
          break;
        }

        case 'typing': {
          // Relay typing indicator to others (not persisted)
          broadcastToOthers(ws, msg);
          break;
        }

        default:
          break;
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('close', () => {
    const userId = connectedUsers.get(ws);
    if (userId) {
      console.log(`👋 ${userId} saiu`);
      // Clean up voice connections for this user
      if (sharedState.chat && Array.isArray(sharedState.chat.voiceConnections)) {
        const before = sharedState.chat.voiceConnections.length;
        sharedState.chat.voiceConnections = sharedState.chat.voiceConnections.filter(
          (vc) => vc.userId !== userId
        );
        if (sharedState.chat.voiceConnections.length !== before) {
          persist();
          // Broadcast updated chat state to remaining clients
          const msg = JSON.stringify({
            type: 'sync',
            store: 'chat',
            state: sharedState.chat,
          });
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              client.send(msg);
            }
          });
        }
      }
    }
    connectedUsers.delete(ws);
    console.log(`   (${wss.clients.size} cliente(s) restante(s))`);
    broadcastPresence();
  });

  ws.on('error', () => {
    connectedUsers.delete(ws);
  });
});

// ── Start ───────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  // Find LAN IP
  let lanIp = 'localhost';
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        lanIp = config.address;
        break;
      }
    }
  }

  console.log('');
  console.log('  ⚡ Concord — Servidor em Tempo Real');
  console.log('  ════════════════════════════════════');
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Na rede:  http://${lanIp}:${PORT}`);
  console.log('');

  // ── Auto-tunnel for internet access ─────────────────────
  if (AUTO_TUNNEL) {
    startTunnel();
  } else {
    console.log('  ℹ️  Túnel desativado (cloud ou NO_TUNNEL=1)');
    console.log('');
  }
});

// ── Tunnel (automatic) ──────────────────────────────────────
async function startTunnel() {
  try {
    let localtunnel;
    try {
      localtunnel = require('localtunnel');
    } catch {
      console.log('  📦 Instalando localtunnel (só na primeira vez)...');
      const { execSync } = require('child_process');
      execSync('npm install --save localtunnel', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
      });
      localtunnel = require('localtunnel');
      console.log('  ✅ localtunnel instalado!');
    }

    const tunnel = await localtunnel({ port: Number(PORT), subdomain: 'concord-app' });

    console.log('  🌐 Acesso pela Internet:');
    console.log(`     ${tunnel.url}`);
    console.log('');
    console.log('  📱 Envie esse link para Gidão, Isadora,');
    console.log('     Ranniere e Isaac usarem de casa!');
    console.log('');
    console.log('  💡 Primeira vez? Clique "Click to Continue"');
    console.log('     na página que aparecer.');
    console.log('');

    // Auto-reconnect tunnel if it drops
    tunnel.on('close', () => {
      console.log('  ⚠️  Túnel caiu, reconectando em 5s...');
      setTimeout(() => startTunnel(), 5000);
    });

    tunnel.on('error', (err) => {
      console.error('  ⚠️  Erro no túnel:', err.message);
      console.log('  🔄 Tentando reconectar em 10s...');
      setTimeout(() => startTunnel(), 10000);
    });
  } catch (err) {
    console.log(`  ⚠️  Túnel indisponível: ${err.message}`);
    console.log('  🏠 Usando apenas rede local.');
    console.log('');
  }
}
