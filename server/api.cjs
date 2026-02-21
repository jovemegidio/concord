// ============================================================
// Concord — REST API Routes
// Normalized CRUD with pagination for all modules
// ============================================================

const express = require('express');
const { getDb } = require('./database.cjs');
const { authMiddleware, sanitizeUser } = require('./auth.cjs');

function createApiRouter(broadcast) {
  const router = express.Router();
  router.use(authMiddleware);

  // ═══════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════
  router.get('/users', (_req, res) => {
    const db = getDb();
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users.map(sanitizeUser));
  });

  router.get('/users/:id', (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(sanitizeUser(user));
  });

  // ═══════════════════════════════════════════════════════════
  // WORKSPACES
  // ═══════════════════════════════════════════════════════════
  router.get('/workspaces', (req, res) => {
    const db = getDb();
    const workspaces = db.prepare(`
      SELECT w.* FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = ?
      ORDER BY w.created_at
    `).all(req.userId);

    const result = workspaces.map((ws) => hydrateWorkspace(db, ws));
    res.json(result);
  });

  router.post('/workspaces', (req, res) => {
    const { id, name, icon, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const db = getDb();
    const wsId = id || genId();
    const now = Date.now();

    db.prepare('INSERT INTO workspaces (id, name, icon, description, owner_id, created_at) VALUES (?,?,?,?,?,?)')
      .run(wsId, name, icon || '⚡', description || '', req.userId, now);
    db.prepare('INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?,?,?,?)')
      .run(wsId, req.userId, 'owner', now);

    const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(wsId);
    const result = hydrateWorkspace(db, ws);
    broadcast(req.userId, { type: 'workspace:created', workspace: result });
    res.status(201).json(result);
  });

  router.patch('/workspaces/:id', (req, res) => {
    const { name, icon, iconImage, description, banner } = req.body;
    const db = getDb();
    const sets = [];
    const vals = [];

    if (name !== undefined) { sets.push('name = ?'); vals.push(name); }
    if (icon !== undefined) { sets.push('icon = ?'); vals.push(icon); }
    if (iconImage !== undefined) { sets.push('icon_image = ?'); vals.push(iconImage); }
    if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
    if (banner !== undefined) { sets.push('banner = ?'); vals.push(banner); }

    if (sets.length === 0) return res.status(400).json({ error: 'Nenhum campo' });
    vals.push(req.params.id);
    db.prepare(`UPDATE workspaces SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(req.params.id);
    const result = hydrateWorkspace(db, ws);
    broadcast(req.userId, { type: 'workspace:updated', workspace: result });
    res.json(result);
  });

  router.delete('/workspaces/:id', (req, res) => {
    const db = getDb();
    if (req.params.id === 'ws-zyntra') return res.status(403).json({ error: 'Zyntra não pode ser deletado' });
    db.prepare('DELETE FROM workspaces WHERE id = ?').run(req.params.id);
    broadcast(req.userId, { type: 'workspace:deleted', workspaceId: req.params.id });
    res.json({ ok: true });
  });

  // Workspace members
  router.post('/workspaces/:id/members', (req, res) => {
    const { userId, role } = req.body;
    const db = getDb();
    db.prepare('INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?,?,?,?)')
      .run(req.params.id, userId, role || 'member', Date.now());
    broadcast(req.userId, { type: 'member:joined', workspaceId: req.params.id, userId });
    res.status(201).json({ ok: true });
  });

  router.delete('/workspaces/:wid/members/:uid', (req, res) => {
    const db = getDb();
    // Can't remove owner
    const member = db.prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?').get(req.params.wid, req.params.uid);
    if (member?.role === 'owner') return res.status(403).json({ error: 'Não pode remover o dono' });
    db.prepare('DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?').run(req.params.wid, req.params.uid);
    broadcast(req.userId, { type: 'member:left', workspaceId: req.params.wid, userId: req.params.uid });
    res.json({ ok: true });
  });

  // ═══════════════════════════════════════════════════════════
  // CHANNELS
  // ═══════════════════════════════════════════════════════════
  router.get('/workspaces/:wid/channels', (req, res) => {
    const db = getDb();
    const channels = db.prepare('SELECT * FROM channels WHERE workspace_id = ? ORDER BY created_at').all(req.params.wid);
    res.json(channels.map(hydrateChannel));
  });

  router.post('/workspaces/:wid/channels', (req, res) => {
    const { id, name, type, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const db = getDb();
    const chId = id || genId();
    const channelName = name.toLowerCase().replace(/\s+/g, '-');

    db.prepare('INSERT INTO channels (id, workspace_id, name, description, type, created_at) VALUES (?,?,?,?,?,?)')
      .run(chId, req.params.wid, channelName, description || '', type || 'text', Date.now());

    const ch = db.prepare('SELECT * FROM channels WHERE id = ?').get(chId);
    broadcast(req.userId, { type: 'channel:created', channel: hydrateChannel(ch) });
    res.status(201).json(hydrateChannel(ch));
  });

  router.patch('/channels/:id', (req, res) => {
    const { name, description, topic } = req.body;
    const db = getDb();
    const sets = [];
    const vals = [];

    if (name !== undefined) { sets.push('name = ?'); vals.push(name.toLowerCase().replace(/\s+/g, '-')); }
    if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
    if (topic !== undefined) { sets.push('topic = ?'); vals.push(topic); }

    if (sets.length === 0) return res.status(400).json({ error: 'Nenhum campo' });
    vals.push(req.params.id);
    db.prepare(`UPDATE channels SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    const ch = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
    broadcast(req.userId, { type: 'channel:updated', channel: hydrateChannel(ch) });
    res.json(hydrateChannel(ch));
  });

  router.delete('/channels/:id', (req, res) => {
    const db = getDb();
    const ch = db.prepare('SELECT workspace_id FROM channels WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM channels WHERE id = ?').run(req.params.id);
    broadcast(req.userId, { type: 'channel:deleted', channelId: req.params.id, workspaceId: ch?.workspace_id });
    res.json({ ok: true });
  });

  // ═══════════════════════════════════════════════════════════
  // MESSAGES (with pagination!)
  // ═══════════════════════════════════════════════════════════
  router.get('/channels/:cid/messages', (req, res) => {
    const db = getDb();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before ? parseInt(req.query.before) : null;

    let messages;
    if (before) {
      messages = db.prepare(`
        SELECT * FROM messages WHERE channel_id = ? AND created_at < ?
        ORDER BY created_at DESC LIMIT ?
      `).all(req.params.cid, before, limit);
    } else {
      messages = db.prepare(`
        SELECT * FROM messages WHERE channel_id = ?
        ORDER BY created_at DESC LIMIT ?
      `).all(req.params.cid, limit);
    }

    // Reverse so messages are in chronological order
    messages.reverse();

    // Hydrate with reactions
    const result = messages.map((m) => hydrateMessage(db, m));

    // Check if there are more messages
    const oldest = messages[0];
    const hasMore = oldest
      ? db.prepare('SELECT COUNT(*) as c FROM messages WHERE channel_id = ? AND created_at < ?').get(req.params.cid, oldest.created_at).c > 0
      : false;

    res.json({ messages: result, hasMore });
  });

  router.post('/channels/:cid/messages', (req, res) => {
    const { id, content, replyToId } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Conteúdo é obrigatório' });

    const db = getDb();
    const msgId = id || genId();
    const now = Date.now();

    db.prepare('INSERT INTO messages (id, channel_id, author_id, content, reply_to_id, created_at) VALUES (?,?,?,?,?,?)')
      .run(msgId, req.params.cid, req.userId, content.trim(), replyToId || null, now);

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
    const result = hydrateMessage(db, msg);

    const ch = db.prepare('SELECT workspace_id FROM channels WHERE id = ?').get(req.params.cid);
    broadcast(req.userId, { type: 'message:created', message: result, workspaceId: ch?.workspace_id });
    res.status(201).json(result);
  });

  router.patch('/messages/:id', (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Conteúdo é obrigatório' });

    const db = getDb();
    db.prepare('UPDATE messages SET content = ?, is_edited = 1, edited_at = ? WHERE id = ?')
      .run(content.trim(), Date.now(), req.params.id);

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
    const result = hydrateMessage(db, msg);
    broadcast(req.userId, { type: 'message:updated', message: result });
    res.json(result);
  });

  router.delete('/messages/:id', (req, res) => {
    const db = getDb();
    const msg = db.prepare('SELECT channel_id FROM messages WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    broadcast(req.userId, { type: 'message:deleted', messageId: req.params.id, channelId: msg?.channel_id });
    res.json({ ok: true });
  });

  // Reactions
  router.post('/messages/:id/reactions', (req, res) => {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji é obrigatório' });

    const db = getDb();
    const existing = db.prepare('SELECT 1 FROM reactions WHERE message_id = ? AND emoji = ? AND user_id = ?')
      .get(req.params.id, emoji, req.userId);

    if (existing) {
      db.prepare('DELETE FROM reactions WHERE message_id = ? AND emoji = ? AND user_id = ?')
        .run(req.params.id, emoji, req.userId);
    } else {
      db.prepare('INSERT INTO reactions (message_id, emoji, user_id) VALUES (?,?,?)')
        .run(req.params.id, emoji, req.userId);
    }

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
    const result = hydrateMessage(db, msg);
    broadcast(req.userId, { type: 'message:updated', message: result });
    res.json(result);
  });

  // Pin/unpin
  router.patch('/messages/:id/pin', (req, res) => {
    const db = getDb();
    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada' });

    const newPinned = msg.is_pinned ? 0 : 1;
    db.prepare('UPDATE messages SET is_pinned = ? WHERE id = ?').run(newPinned, req.params.id);

    const updated = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
    const result = hydrateMessage(db, updated);
    broadcast(req.userId, { type: 'message:updated', message: result });
    res.json(result);
  });

  // ═══════════════════════════════════════════════════════════
  // BOARDS
  // ═══════════════════════════════════════════════════════════
  router.get('/workspaces/:wid/boards', (req, res) => {
    const db = getDb();
    const boards = db.prepare('SELECT * FROM boards WHERE workspace_id = ? ORDER BY created_at').all(req.params.wid);
    res.json(boards.map((b) => hydrateBoard(db, b)));
  });

  router.post('/workspaces/:wid/boards', (req, res) => {
    const { id, title } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

    const db = getDb();
    const boardId = id || genId();
    const now = Date.now();

    const tx = db.transaction(() => {
      db.prepare('INSERT INTO boards (id, workspace_id, title, created_at, updated_at) VALUES (?,?,?,?,?)')
        .run(boardId, req.params.wid, title, now, now);

      // Default labels
      const defaultLabels = [
        ['lb-' + genShort(), boardId, 'Bug', '#ef4444'],
        ['lb-' + genShort(), boardId, 'Funcionalidade', '#8b5cf6'],
        ['lb-' + genShort(), boardId, 'Melhoria', '#06b6d4'],
        ['lb-' + genShort(), boardId, 'Documentação', '#f59e0b'],
        ['lb-' + genShort(), boardId, 'Urgente', '#f97316'],
        ['lb-' + genShort(), boardId, 'Design', '#ec4899'],
      ];
      const insertLabel = db.prepare('INSERT INTO board_labels (id, board_id, name, color) VALUES (?,?,?,?)');
      for (const l of defaultLabels) insertLabel.run(...l);

      // Default columns
      const cols = [
        [genId(), boardId, 'A Fazer', 0],
        [genId(), boardId, 'Em Progresso', 1],
        [genId(), boardId, 'Concluído', 2],
      ];
      const insertCol = db.prepare('INSERT INTO board_columns (id, board_id, title, position) VALUES (?,?,?,?)');
      for (const c of cols) insertCol.run(...c);
    });
    tx();

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:created', board: result });
    res.status(201).json(result);
  });

  router.patch('/boards/:id', (req, res) => {
    const { title } = req.body;
    const db = getDb();
    if (title) db.prepare('UPDATE boards SET title = ?, updated_at = ? WHERE id = ?').run(title, Date.now(), req.params.id);
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:updated', board: result });
    res.json(result);
  });

  router.delete('/boards/:id', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id);
    broadcast(req.userId, { type: 'board:deleted', boardId: req.params.id });
    res.json({ ok: true });
  });

  // Columns
  router.post('/boards/:bid/columns', (req, res) => {
    const { id, title } = req.body;
    const db = getDb();
    const maxPos = db.prepare('SELECT MAX(position) as m FROM board_columns WHERE board_id = ?').get(req.params.bid);
    const colId = id || genId();
    db.prepare('INSERT INTO board_columns (id, board_id, title, position) VALUES (?,?,?,?)').run(colId, req.params.bid, title, (maxPos.m ?? -1) + 1);
    db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), req.params.bid);

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.bid);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:updated', board: result });
    res.status(201).json(result);
  });

  router.patch('/columns/:id', (req, res) => {
    const { title, position } = req.body;
    const db = getDb();
    const col = db.prepare('SELECT * FROM board_columns WHERE id = ?').get(req.params.id);
    if (!col) return res.status(404).json({ error: 'Coluna não encontrada' });

    if (title !== undefined) db.prepare('UPDATE board_columns SET title = ? WHERE id = ?').run(title, req.params.id);
    if (position !== undefined) {
      // Reorder columns
      const cols = db.prepare('SELECT id FROM board_columns WHERE board_id = ? ORDER BY position').all(col.board_id);
      const oldIdx = cols.findIndex(c => c.id === req.params.id);
      if (oldIdx !== -1) {
        cols.splice(oldIdx, 1);
        cols.splice(position, 0, { id: req.params.id });
        const upd = db.prepare('UPDATE board_columns SET position = ? WHERE id = ?');
        cols.forEach((c, i) => upd.run(i, c.id));
      }
    }
    db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), col.board_id);

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(col.board_id);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:updated', board: result });
    res.json(result);
  });

  router.delete('/columns/:id', (req, res) => {
    const db = getDb();
    const col = db.prepare('SELECT board_id FROM board_columns WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM board_columns WHERE id = ?').run(req.params.id);
    if (col) {
      // Re-index remaining columns
      const remaining = db.prepare('SELECT id FROM board_columns WHERE board_id = ? ORDER BY position').all(col.board_id);
      const upd = db.prepare('UPDATE board_columns SET position = ? WHERE id = ?');
      remaining.forEach((c, i) => upd.run(i, c.id));
      db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), col.board_id);

      const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(col.board_id);
      const result = hydrateBoard(db, board);
      broadcast(req.userId, { type: 'board:updated', board: result });
    }
    res.json({ ok: true });
  });

  // Cards
  router.post('/columns/:colId/cards', (req, res) => {
    const { id, title, boardId } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

    const db = getDb();
    const col = db.prepare('SELECT * FROM board_columns WHERE id = ?').get(req.params.colId);
    if (!col) return res.status(404).json({ error: 'Coluna não encontrada' });

    const bId = boardId || col.board_id;
    const cardId = id || genId();
    const maxPos = db.prepare('SELECT MAX(position) as m FROM cards WHERE column_id = ?').get(req.params.colId);

    db.prepare('INSERT INTO cards (id, column_id, board_id, title, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
      .run(cardId, req.params.colId, bId, title, (maxPos.m ?? -1) + 1, Date.now(), Date.now());
    db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), bId);

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(bId);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:updated', board: result });
    res.status(201).json(result);
  });

  router.patch('/cards/:id', (req, res) => {
    const { title, description, priority, dueDate, assignees, labels, checklist, columnId } = req.body;
    const db = getDb();
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card não encontrado' });

    const sets = ['updated_at = ?'];
    const vals = [Date.now()];

    if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
    if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
    if (priority !== undefined) { sets.push('priority = ?'); vals.push(priority); }
    if (dueDate !== undefined) { sets.push('due_date = ?'); vals.push(dueDate); }
    if (columnId !== undefined) { sets.push('column_id = ?'); vals.push(columnId); }

    vals.push(req.params.id);
    db.prepare(`UPDATE cards SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    // Handle array updates
    if (assignees !== undefined) {
      db.prepare('DELETE FROM card_assignees WHERE card_id = ?').run(req.params.id);
      const ins = db.prepare('INSERT INTO card_assignees (card_id, user_id) VALUES (?,?)');
      for (const uid of assignees) ins.run(req.params.id, uid);
    }

    if (labels !== undefined) {
      db.prepare('DELETE FROM card_labels WHERE card_id = ?').run(req.params.id);
      const ins = db.prepare('INSERT OR IGNORE INTO card_labels (card_id, label_id) VALUES (?,?)');
      for (const l of labels) ins.run(req.params.id, l.id || l);
    }

    if (checklist !== undefined) {
      db.prepare('DELETE FROM card_checklist WHERE card_id = ?').run(req.params.id);
      const ins = db.prepare('INSERT INTO card_checklist (id, card_id, text, is_completed, position) VALUES (?,?,?,?,?)');
      checklist.forEach((item, i) => ins.run(item.id || genId(), req.params.id, item.text, item.isCompleted ? 1 : 0, i));
    }

    db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), card.board_id);

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(card.board_id);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:updated', board: result });
    res.json(result);
  });

  router.delete('/cards/:id', (req, res) => {
    const db = getDb();
    const card = db.prepare('SELECT board_id, column_id FROM cards WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
    if (card) {
      // Re-index
      const remaining = db.prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position').all(card.column_id);
      const upd = db.prepare('UPDATE cards SET position = ? WHERE id = ?');
      remaining.forEach((c, i) => upd.run(i, c.id));
      db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), card.board_id);

      const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(card.board_id);
      const result = hydrateBoard(db, board);
      broadcast(req.userId, { type: 'board:updated', board: result });
    }
    res.json({ ok: true });
  });

  // Move card between columns
  router.patch('/cards/:id/move', (req, res) => {
    const { toColumnId, position } = req.body;
    const db = getDb();
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card não encontrado' });

    const tx = db.transaction(() => {
      // Remove from old column position
      db.prepare('UPDATE cards SET column_id = ?, position = ?, updated_at = ? WHERE id = ?')
        .run(toColumnId, position ?? 0, Date.now(), req.params.id);

      // Re-index source column
      const srcCards = db.prepare('SELECT id FROM cards WHERE column_id = ? AND id != ? ORDER BY position').all(card.column_id, req.params.id);
      const updPos = db.prepare('UPDATE cards SET position = ? WHERE id = ?');
      srcCards.forEach((c, i) => updPos.run(i, c.id));

      // Re-index target column
      const tgtCards = db.prepare('SELECT id FROM cards WHERE column_id = ? ORDER BY position, updated_at DESC').all(toColumnId);
      tgtCards.forEach((c, i) => updPos.run(i, c.id));

      db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), card.board_id);
    });
    tx();

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(card.board_id);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:updated', board: result });
    res.json(result);
  });

  // Card comments
  router.post('/cards/:cid/comments', (req, res) => {
    const { id, content } = req.body;
    const db = getDb();
    const card = db.prepare('SELECT board_id FROM cards WHERE id = ?').get(req.params.cid);
    if (!card) return res.status(404).json({ error: 'Card não encontrado' });

    db.prepare('INSERT INTO card_comments (id, card_id, author_id, content, created_at) VALUES (?,?,?,?,?)')
      .run(id || genId(), req.params.cid, req.userId, content, Date.now());
    db.prepare('UPDATE cards SET updated_at = ? WHERE id = ?').run(Date.now(), req.params.cid);
    db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), card.board_id);

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(card.board_id);
    const result = hydrateBoard(db, board);
    broadcast(req.userId, { type: 'board:updated', board: result });
    res.status(201).json(result);
  });

  router.delete('/cards/:cid/comments/:comId', (req, res) => {
    const db = getDb();
    const card = db.prepare('SELECT board_id FROM cards WHERE id = ?').get(req.params.cid);
    db.prepare('DELETE FROM card_comments WHERE id = ?').run(req.params.comId);
    if (card) {
      db.prepare('UPDATE boards SET updated_at = ? WHERE id = ?').run(Date.now(), card.board_id);
      const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(card.board_id);
      const result = hydrateBoard(db, board);
      broadcast(req.userId, { type: 'board:updated', board: result });
    }
    res.json({ ok: true });
  });

  // ═══════════════════════════════════════════════════════════
  // PAGES
  // ═══════════════════════════════════════════════════════════
  router.get('/workspaces/:wid/pages', (req, res) => {
    const db = getDb();
    const pages = db.prepare('SELECT * FROM pages WHERE workspace_id = ? ORDER BY created_at').all(req.params.wid);
    res.json(pages.map((p) => hydratePage(db, p)));
  });

  router.post('/workspaces/:wid/pages', (req, res) => {
    const { id, title, icon, parentId } = req.body;
    const db = getDb();
    const pageId = id || genId();
    const now = Date.now();

    db.prepare('INSERT INTO pages (id, workspace_id, parent_id, title, icon, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
      .run(pageId, req.params.wid, parentId || null, title || 'Sem título', icon || '📄', now, now);

    // Add default empty paragraph block
    db.prepare('INSERT INTO blocks (id, page_id, type, content, properties, position) VALUES (?,?,?,?,?,?)')
      .run(genId(), pageId, 'paragraph', '', '{}', 0);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(pageId);
    const result = hydratePage(db, page);
    broadcast(req.userId, { type: 'page:created', page: result });
    res.status(201).json(result);
  });

  router.patch('/pages/:id', (req, res) => {
    const { title, icon, coverImage, isFavorite, parentId, lastEditedBy } = req.body;
    const db = getDb();
    const sets = ['updated_at = ?'];
    const vals = [Date.now()];

    if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
    if (icon !== undefined) { sets.push('icon = ?'); vals.push(icon); }
    if (coverImage !== undefined) { sets.push('cover_image = ?'); vals.push(coverImage); }
    if (isFavorite !== undefined) { sets.push('is_favorite = ?'); vals.push(isFavorite ? 1 : 0); }
    if (parentId !== undefined) { sets.push('parent_id = ?'); vals.push(parentId); }
    if (lastEditedBy !== undefined) { sets.push('last_edited_by = ?'); vals.push(lastEditedBy); }

    vals.push(req.params.id);
    db.prepare(`UPDATE pages SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
    const result = hydratePage(db, page);
    broadcast(req.userId, { type: 'page:updated', page: result });
    res.json(result);
  });

  router.delete('/pages/:id', (req, res) => {
    const db = getDb();
    // Recursively collect page IDs to delete
    const toDelete = [];
    const collect = (pid) => {
      toDelete.push(pid);
      const children = db.prepare('SELECT id FROM pages WHERE parent_id = ?').all(pid);
      for (const c of children) collect(c.id);
    };
    collect(req.params.id);

    const tx = db.transaction(() => {
      for (const pid of toDelete) {
        db.prepare('DELETE FROM pages WHERE id = ?').run(pid);
      }
    });
    tx();

    broadcast(req.userId, { type: 'page:deleted', pageIds: toDelete });
    res.json({ ok: true });
  });

  // Blocks
  router.post('/pages/:pid/blocks', (req, res) => {
    const { id, type, afterBlockId } = req.body;
    const db = getDb();
    const blockId = id || genId();

    let position;
    if (afterBlockId) {
      const after = db.prepare('SELECT position FROM blocks WHERE id = ?').get(afterBlockId);
      position = after ? after.position + 1 : 0;
      // Shift blocks after this position
      db.prepare('UPDATE blocks SET position = position + 1 WHERE page_id = ? AND position >= ?').run(req.params.pid, position);
    } else {
      const max = db.prepare('SELECT MAX(position) as m FROM blocks WHERE page_id = ?').get(req.params.pid);
      position = (max.m ?? -1) + 1;
    }

    const props = type === 'todo' ? JSON.stringify({ checked: false }) : '{}';
    db.prepare('INSERT INTO blocks (id, page_id, type, content, properties, position) VALUES (?,?,?,?,?,?)')
      .run(blockId, req.params.pid, type || 'paragraph', '', props, position);
    db.prepare('UPDATE pages SET updated_at = ? WHERE id = ?').run(Date.now(), req.params.pid);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.pid);
    const result = hydratePage(db, page);
    broadcast(req.userId, { type: 'page:updated', page: result });
    res.status(201).json({ blockId, page: result });
  });

  router.patch('/blocks/:id', (req, res) => {
    const { content, type, properties } = req.body;
    const db = getDb();
    const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(req.params.id);
    if (!block) return res.status(404).json({ error: 'Bloco não encontrado' });

    const sets = [];
    const vals = [];

    if (content !== undefined) { sets.push('content = ?'); vals.push(content); }
    if (type !== undefined) { sets.push('type = ?'); vals.push(type); }
    if (properties !== undefined) {
      const merged = { ...JSON.parse(block.properties || '{}'), ...properties };
      sets.push('properties = ?');
      vals.push(JSON.stringify(merged));
    }

    if (sets.length > 0) {
      vals.push(req.params.id);
      db.prepare(`UPDATE blocks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    }

    db.prepare('UPDATE pages SET updated_at = ? WHERE id = ?').run(Date.now(), block.page_id);

    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(block.page_id);
    const result = hydratePage(db, page);
    broadcast(req.userId, { type: 'page:updated', page: result });
    res.json(result);
  });

  router.delete('/blocks/:id', (req, res) => {
    const db = getDb();
    const block = db.prepare('SELECT page_id FROM blocks WHERE id = ?').get(req.params.id);
    if (!block) return res.json({ ok: true });

    // Don't delete last block
    const count = db.prepare('SELECT COUNT(*) as c FROM blocks WHERE page_id = ?').get(block.page_id);
    if (count.c <= 1) {
      db.prepare("UPDATE blocks SET content = '', type = 'paragraph', properties = '{}' WHERE id = ?").run(req.params.id);
    } else {
      db.prepare('DELETE FROM blocks WHERE id = ?').run(req.params.id);
      // Re-index
      const remaining = db.prepare('SELECT id FROM blocks WHERE page_id = ? ORDER BY position').all(block.page_id);
      const upd = db.prepare('UPDATE blocks SET position = ? WHERE id = ?');
      remaining.forEach((b, i) => upd.run(i, b.id));
    }

    db.prepare('UPDATE pages SET updated_at = ? WHERE id = ?').run(Date.now(), block.page_id);
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(block.page_id);
    const result = hydratePage(db, page);
    broadcast(req.userId, { type: 'page:updated', page: result });
    res.json(result);
  });

  return router;
}

// ═══════════════════════════════════════════════════════════
// Hydration helpers — Convert flat DB rows to nested app shapes
// ═══════════════════════════════════════════════════════════
function hydrateWorkspace(db, ws) {
  const members = db.prepare('SELECT * FROM workspace_members WHERE workspace_id = ?').all(ws.id);
  const channels = db.prepare('SELECT * FROM channels WHERE workspace_id = ? ORDER BY created_at').all(ws.id);

  return {
    id: ws.id,
    name: ws.name,
    icon: ws.icon,
    iconImage: ws.icon_image || '',
    description: ws.description || '',
    banner: ws.banner || '',
    ownerId: ws.owner_id,
    members: members.map((m) => ({ userId: m.user_id, role: m.role, joinedAt: m.joined_at })),
    channels: channels.map(hydrateChannel),
    boards: [],
    pages: [],
    createdAt: ws.created_at,
  };
}

function hydrateChannel(ch) {
  return {
    id: ch.id,
    workspaceId: ch.workspace_id,
    name: ch.name,
    description: ch.description || '',
    type: ch.type,
    messages: [], // Messages loaded separately via pagination
    pinnedMessageIds: [],
    topic: ch.topic || '',
    categoryId: ch.category_id || '',
    createdAt: ch.created_at,
  };
}

function hydrateMessage(db, msg) {
  const reactions = db.prepare('SELECT emoji, user_id FROM reactions WHERE message_id = ?').all(msg.id);
  const grouped = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.user_id);
  }

  return {
    id: msg.id,
    channelId: msg.channel_id,
    authorId: msg.author_id,
    content: msg.content,
    attachments: [],
    reactions: Object.entries(grouped).map(([emoji, userIds]) => ({ emoji, userIds })),
    isPinned: !!msg.is_pinned,
    isEdited: !!msg.is_edited,
    replyToId: msg.reply_to_id || undefined,
    createdAt: msg.created_at,
    editedAt: msg.edited_at || undefined,
  };
}

function hydrateBoard(db, board) {
  const columns = db.prepare('SELECT * FROM board_columns WHERE board_id = ? ORDER BY position').all(board.id);
  const labels = db.prepare('SELECT * FROM board_labels WHERE board_id = ?').all(board.id);

  return {
    id: board.id,
    workspaceId: board.workspace_id,
    title: board.title,
    columns: columns.map((col) => {
      const cards = db.prepare('SELECT * FROM cards WHERE column_id = ? ORDER BY position').all(col.id);
      return {
        id: col.id,
        boardId: col.board_id,
        title: col.title,
        position: col.position,
        cards: cards.map((c) => hydrateCard(db, c, labels)),
      };
    }),
    labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
    createdAt: board.created_at,
    updatedAt: board.updated_at,
  };
}

function hydrateCard(db, card, boardLabels) {
  const assignees = db.prepare('SELECT user_id FROM card_assignees WHERE card_id = ?').all(card.id).map((a) => a.user_id);
  const labelIds = db.prepare('SELECT label_id FROM card_labels WHERE card_id = ?').all(card.id).map((l) => l.label_id);
  const cardLabels = boardLabels.filter((l) => labelIds.includes(l.id)).map((l) => ({ id: l.id, name: l.name, color: l.color }));
  const checklist = db.prepare('SELECT * FROM card_checklist WHERE card_id = ? ORDER BY position').all(card.id);
  const comments = db.prepare('SELECT * FROM card_comments WHERE card_id = ? ORDER BY created_at').all(card.id);

  return {
    id: card.id,
    columnId: card.column_id,
    title: card.title,
    description: card.description || '',
    assignees,
    labels: cardLabels,
    priority: card.priority || 'none',
    dueDate: card.due_date || undefined,
    checklist: checklist.map((i) => ({ id: i.id, text: i.text, isCompleted: !!i.is_completed })),
    comments: comments.map((c) => ({ id: c.id, cardId: c.card_id, authorId: c.author_id, content: c.content, createdAt: c.created_at })),
    attachments: [],
    position: card.position,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  };
}

function hydratePage(db, page) {
  const blocks = db.prepare('SELECT * FROM blocks WHERE page_id = ? ORDER BY position').all(page.id);
  const children = db.prepare('SELECT id FROM pages WHERE parent_id = ?').all(page.id).map((c) => c.id);

  return {
    id: page.id,
    workspaceId: page.workspace_id,
    parentId: page.parent_id || undefined,
    title: page.title,
    icon: page.icon || '📄',
    coverImage: page.cover_image || '',
    blocks: blocks.map((b) => ({
      id: b.id,
      pageId: b.page_id,
      type: b.type,
      content: b.content || '',
      properties: JSON.parse(b.properties || '{}'),
      position: b.position,
    })),
    children,
    isFavorite: !!page.is_favorite,
    lastEditedBy: page.last_edited_by || '',
    createdAt: page.created_at,
    updatedAt: page.updated_at,
  };
}

// ── ID helpers ──────────────────────────────────────────────
function genId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function genShort() {
  return Math.random().toString(36).slice(2, 8);
}

module.exports = { createApiRouter };
