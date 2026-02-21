// ============================================================
// Concord — JWT Authentication
// bcrypt password hashing + JWT access/refresh tokens
// ============================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb, generateTokenId } = require('./database.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'concord-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Token Generation ────────────────────────────────────────
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

function generateRefreshToken(userId) {
  const db = getDb();
  const tokenId = generateTokenId();
  const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY_MS;

  db.prepare('INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, ?)')
    .run(generateTokenId(), userId, tokenId, expiresAt);

  // Clean up expired sessions
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());

  return tokenId;
}

// ── Verify Token ────────────────────────────────────────────
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ── Auth Middleware for Express ──────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  req.userId = payload.sub;
  req.userEmail = payload.email;
  next();
}

// ── Auth Routes ─────────────────────────────────────────────
function createAuthRouter() {
  const express = require('express');
  const router = express.Router();

  // POST /api/auth/login
  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  });

  // POST /api/auth/register
  router.post('/register', (req, res) => {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const id = 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const passwordHash = bcrypt.hashSync(password, 10);
    const name = displayName.toLowerCase().replace(/\s+/g, '');

    db.prepare('INSERT INTO users (id, email, display_name, password_hash, name) VALUES (?,?,?,?,?)')
      .run(id, email, displayName, passwordHash, name);

    // Auto-add to Zyntra workspace
    const zyntra = db.prepare('SELECT id FROM workspaces WHERE id = ?').get('ws-zyntra');
    if (zyntra) {
      db.prepare('INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role) VALUES (?,?,?)')
        .run('ws-zyntra', id, 'member');
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  });

  // POST /api/auth/refresh
  router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token necessário' });
    }

    const db = getDb();
    const session = db.prepare('SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > ?')
      .get(refreshToken, Date.now());

    if (!session) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Rotate refresh token
    db.prepare('DELETE FROM sessions WHERE refresh_token = ?').run(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      user: sanitizeUser(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  // POST /api/auth/logout
  router.post('/logout', authMiddleware, (req, res) => {
    const { refreshToken } = req.body;
    const db = getDb();
    if (refreshToken) {
      db.prepare('DELETE FROM sessions WHERE refresh_token = ?').run(refreshToken);
    } else {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.userId);
    }
    res.json({ ok: true });
  });

  // GET /api/auth/me
  router.get('/me', authMiddleware, (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ user: sanitizeUser(user) });
  });

  // PATCH /api/auth/profile
  router.patch('/profile', authMiddleware, (req, res) => {
    const { displayName, avatar, customStatus, aboutMe, banner, status } = req.body;
    const db = getDb();
    const sets = [];
    const vals = [];

    if (displayName !== undefined) { sets.push('display_name = ?'); vals.push(displayName); }
    if (avatar !== undefined) { sets.push('avatar = ?'); vals.push(avatar); }
    if (customStatus !== undefined) { sets.push('custom_status = ?'); vals.push(customStatus); }
    if (aboutMe !== undefined) { sets.push('about_me = ?'); vals.push(aboutMe); }
    if (banner !== undefined) { sets.push('banner = ?'); vals.push(banner); }
    if (status !== undefined) { sets.push('status = ?'); vals.push(status); }

    if (sets.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    vals.push(req.userId);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    res.json({ user: sanitizeUser(user) });
  });

  return router;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.display_name,
    avatar: user.avatar || '',
    status: user.status || 'online',
    customStatus: user.custom_status || '',
    aboutMe: user.about_me || '',
    banner: user.banner || '',
    createdAt: user.created_at,
  };
}

module.exports = { createAuthRouter, authMiddleware, verifyAccessToken, sanitizeUser, bcrypt };
