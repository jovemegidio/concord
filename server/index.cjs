// ============================================================
// Concord — Scalable Server
// SQLite + JWT Auth + REST API + Granular WebSocket Events
// ============================================================

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { getDb, migrateFromJson, seedUsers } = require('./database.cjs');
const { createAuthRouter, bcrypt } = require('./auth.cjs');
const { createApiRouter } = require('./api.cjs');
const { createRealtimeServer } = require('./realtime.cjs');

// ── Config ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const AUTO_TUNNEL = process.env.NO_TUNNEL !== '1' && !process.env.RENDER;

// ── Initialize Database ─────────────────────────────────────
console.log('🗄️  Inicializando banco de dados...');
getDb(); // Creates tables

// Migrate from old data.json if it exists
migrateFromJson(bcrypt.hashSync.bind(bcrypt));

// Seed default users if DB is empty
seedUsers(bcrypt.hashSync.bind(bcrypt));

// ── Express App ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Security
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SPA
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, tente novamente em breve' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Muitas tentativas de login, tente novamente em 15 minutos' },
});

// ── WebSocket (before routes) ───────────────────────────────
const { broadcastEvent } = createRealtimeServer(server);

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authLimiter, createAuthRouter());
app.use('/api', apiLimiter, createApiRouter(broadcastEvent));

// Health check
app.get('/api/health', (_req, res) => {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const msgCount = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: 'sqlite',
    users: userCount,
    messages: msgCount,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve Frontend ──────────────────────────────────────────
app.use(express.static(DIST_DIR));
app.get('*', (_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <html>
        <body style="background:#020617;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <h1>⚡ Concord Server v2</h1>
            <p>SQLite + JWT + REST API + WebSocket Events</p>
            <p style="color:#818cf8">Rode <code>npm run build</code> para gerar o frontend.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// ── Graceful Shutdown ───────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n⚡ ${signal} recebido, fechando...`);
  const db = getDb();
  db.close();
  process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Start ───────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
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
  console.log('  ⚡ Concord v2 — Servidor Escalável');
  console.log('  ═══════════════════════════════════');
  console.log(`  Local:     http://localhost:${PORT}`);
  console.log(`  Na rede:   http://${lanIp}:${PORT}`);
  console.log(`  API:       http://localhost:${PORT}/api`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log('  Database:  SQLite (WAL mode)');
  console.log('  Auth:      JWT + bcrypt');
  console.log('');

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
      console.log('  📦 Instalando localtunnel...');
      const { execSync } = require('child_process');
      execSync('npm install --save localtunnel', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      localtunnel = require('localtunnel');
    }

    const tunnel = await localtunnel({ port: Number(PORT), subdomain: 'concord-app' });
    console.log(`  🌐 Internet: ${tunnel.url}`);
    console.log('');

    tunnel.on('close', () => {
      console.log('  ⚠️  Túnel caiu, reconectando em 5s...');
      setTimeout(() => startTunnel(), 5000);
    });
    tunnel.on('error', (err) => {
      console.error('  ⚠️  Túnel:', err.message);
      setTimeout(() => startTunnel(), 10000);
    });
  } catch (err) {
    console.log(`  ⚠️  Túnel indisponível: ${err.message}`);
    console.log('');
  }
}
