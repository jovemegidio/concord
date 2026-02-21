// ============================================================
// Concord — SQLite Database Layer
// Normalized schema with proper indexes for scalability
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'concord.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');     // Much better concurrent read performance
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');   // Good balance of speed/safety with WAL
    migrate();
  }
  return db;
}

// ── Schema Migration ────────────────────────────────────────
function migrate() {
  db.exec(`
    -- Auth
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      avatar TEXT DEFAULT '',
      status TEXT DEFAULT 'online',
      custom_status TEXT DEFAULT '',
      about_me TEXT DEFAULT '',
      banner TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    -- Workspaces
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '⚡',
      icon_image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      banner TEXT DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      PRIMARY KEY (workspace_id, user_id)
    );

    -- Channels
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'text',
      topic TEXT DEFAULT '',
      category_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_channels_workspace ON channels(workspace_id);

    -- Messages (the big one — needs proper indexes)
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL DEFAULT '',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_edited INTEGER NOT NULL DEFAULT 0,
      reply_to_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      edited_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_messages_channel_time ON messages(channel_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(channel_id, is_pinned) WHERE is_pinned = 1;

    -- Reactions
    CREATE TABLE IF NOT EXISTS reactions (
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY (message_id, emoji, user_id)
    );

    -- Boards
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_boards_workspace ON boards(workspace_id);

    CREATE TABLE IF NOT EXISTS board_labels (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS board_columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_columns_board ON board_columns(board_id, position);

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      column_id TEXT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'none',
      due_date INTEGER,
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id, position);

    CREATE TABLE IF NOT EXISTS card_labels (
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES board_labels(id) ON DELETE CASCADE,
      PRIMARY KEY (card_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS card_assignees (
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      PRIMARY KEY (card_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS card_checklist (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS card_comments (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    -- Pages
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      parent_id TEXT REFERENCES pages(id) ON DELETE SET NULL,
      title TEXT NOT NULL DEFAULT 'Sem título',
      icon TEXT DEFAULT '📄',
      cover_image TEXT DEFAULT '',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      last_edited_by TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_pages_workspace ON pages(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);

    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'paragraph',
      content TEXT DEFAULT '',
      properties TEXT DEFAULT '{}',
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id, position);
  `);
}

// ── Data Migration from old data.json ───────────────────────
function migrateFromJson(bcryptHashSync) {
  const jsonPath = path.join(__dirname, 'data.json');
  if (!fs.existsSync(jsonPath)) return false;

  const d = getDb();
  const existingUsers = d.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existingUsers.c > 0) return false; // Already migrated

  console.log('📦 Migrando data.json → SQLite...');

  let old;
  try {
    old = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch {
    console.warn('⚠️  data.json inválido, pulando migração');
    return false;
  }

  const tx = d.transaction(() => {
    // Migrate users (from CONCORD_USERS + any currentUser data)
    const defaultUsers = [
      { id: 'u-gidao', name: 'gidao', displayName: 'Gidão', email: 'gidao@concord.app' },
      { id: 'u-isadora', name: 'isadora', displayName: 'Isadora', email: 'isadora@concord.app' },
      { id: 'u-ranniere', name: 'ranniere', displayName: 'Ranniere', email: 'ranniere@concord.app' },
      { id: 'u-isaac', name: 'isaac', displayName: 'Isaac', email: 'isaac@concord.app' },
      { id: 'u-clemerson', name: 'clemerson', displayName: 'Clemerson', email: 'clemerson@concord.app' },
    ];

    const passwordHash = bcryptHashSync('Concordbot', 10);

    const insertUser = d.prepare(`
      INSERT OR IGNORE INTO users (id, email, display_name, password_hash, name, avatar, status, custom_status, about_me, banner)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // If we have currentUser data from the old state, merge it
    const oldCurrentUser = old.chat?.currentUser;

    for (const u of defaultUsers) {
      const isCurrentUser = oldCurrentUser && oldCurrentUser.id === u.id;
      insertUser.run(
        u.id,
        u.email,
        isCurrentUser ? (oldCurrentUser.displayName || u.displayName) : u.displayName,
        passwordHash,
        u.name,
        isCurrentUser ? (oldCurrentUser.avatar || '') : '',
        'online',
        isCurrentUser ? (oldCurrentUser.customStatus || '') : '',
        isCurrentUser ? (oldCurrentUser.aboutMe || '') : '',
        isCurrentUser ? (oldCurrentUser.banner || '') : '',
      );
    }

    // Migrate workspaces
    const workspaces = old.chat?.workspaces || [];
    const insertWs = d.prepare('INSERT OR IGNORE INTO workspaces (id, name, icon, icon_image, description, banner, owner_id, created_at) VALUES (?,?,?,?,?,?,?,?)');
    const insertWm = d.prepare('INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?,?,?,?)');
    const insertCh = d.prepare('INSERT OR IGNORE INTO channels (id, workspace_id, name, description, type, created_at) VALUES (?,?,?,?,?,?)');
    const insertMsg = d.prepare('INSERT OR IGNORE INTO messages (id, channel_id, author_id, content, is_pinned, is_edited, reply_to_id, created_at, edited_at) VALUES (?,?,?,?,?,?,?,?,?)');
    const insertReaction = d.prepare('INSERT OR IGNORE INTO reactions (message_id, emoji, user_id) VALUES (?,?,?)');

    for (const ws of workspaces) {
      insertWs.run(ws.id, ws.name, ws.icon || '⚡', ws.iconImage || '', ws.description || '', ws.banner || '', ws.ownerId || 'u-gidao', ws.createdAt || Date.now());

      for (const m of (ws.members || [])) {
        insertWm.run(ws.id, m.userId, m.role || 'member', m.joinedAt || Date.now());
      }

      for (const ch of (ws.channels || [])) {
        insertCh.run(ch.id, ws.id, ch.name, ch.description || '', ch.type || 'text', ch.createdAt || Date.now());

        for (const msg of (ch.messages || [])) {
          insertMsg.run(msg.id, ch.id, msg.authorId, msg.content || '', msg.isPinned ? 1 : 0, msg.isEdited ? 1 : 0, msg.replyToId || null, msg.createdAt || Date.now(), msg.editedAt || null);

          for (const r of (msg.reactions || [])) {
            for (const uid of (r.userIds || [])) {
              insertReaction.run(msg.id, r.emoji, uid);
            }
          }
        }
      }
    }

    // Migrate boards
    const boards = old.boards?.boards || [];
    const insertBoard = d.prepare('INSERT OR IGNORE INTO boards (id, workspace_id, title, created_at, updated_at) VALUES (?,?,?,?,?)');
    const insertLabel = d.prepare('INSERT OR IGNORE INTO board_labels (id, board_id, name, color) VALUES (?,?,?,?)');
    const insertCol = d.prepare('INSERT OR IGNORE INTO board_columns (id, board_id, title, position) VALUES (?,?,?,?)');
    const insertCard = d.prepare('INSERT OR IGNORE INTO cards (id, column_id, board_id, title, description, priority, due_date, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const insertCardLabel = d.prepare('INSERT OR IGNORE INTO card_labels (card_id, label_id) VALUES (?,?)');
    const insertCardAssignee = d.prepare('INSERT OR IGNORE INTO card_assignees (card_id, user_id) VALUES (?,?)');
    const insertChecklist = d.prepare('INSERT OR IGNORE INTO card_checklist (id, card_id, text, is_completed, position) VALUES (?,?,?,?,?)');
    const insertComment = d.prepare('INSERT OR IGNORE INTO card_comments (id, card_id, author_id, content, created_at) VALUES (?,?,?,?,?)');

    for (const board of boards) {
      insertBoard.run(board.id, board.workspaceId, board.title, board.createdAt || Date.now(), board.updatedAt || Date.now());

      for (const label of (board.labels || [])) {
        insertLabel.run(label.id, board.id, label.name, label.color);
      }

      for (const col of (board.columns || [])) {
        insertCol.run(col.id, board.id, col.title, col.position || 0);

        for (const card of (col.cards || [])) {
          insertCard.run(card.id, col.id, board.id, card.title, card.description || '', card.priority || 'none', card.dueDate || null, card.position || 0, card.createdAt || Date.now(), card.updatedAt || Date.now());

          for (const label of (card.labels || [])) {
            insertCardLabel.run(card.id, label.id);
          }
          for (const uid of (card.assignees || [])) {
            insertCardAssignee.run(card.id, uid);
          }
          for (let i = 0; i < (card.checklist || []).length; i++) {
            const item = card.checklist[i];
            insertChecklist.run(item.id, card.id, item.text, item.isCompleted ? 1 : 0, i);
          }
          for (const comment of (card.comments || [])) {
            insertComment.run(comment.id, card.id, comment.authorId, comment.content, comment.createdAt || Date.now());
          }
        }
      }
    }

    // Migrate pages
    const pages = old.pages?.pages || [];
    const insertPage = d.prepare('INSERT OR IGNORE INTO pages (id, workspace_id, parent_id, title, icon, cover_image, is_favorite, last_edited_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const insertBlock = d.prepare('INSERT OR IGNORE INTO blocks (id, page_id, type, content, properties, position) VALUES (?,?,?,?,?,?)');

    for (const page of pages) {
      insertPage.run(page.id, page.workspaceId, page.parentId || null, page.title, page.icon || '📄', page.coverImage || '', page.isFavorite ? 1 : 0, page.lastEditedBy || '', page.createdAt || Date.now(), page.updatedAt || Date.now());

      for (const block of (page.blocks || [])) {
        insertBlock.run(block.id, page.id, block.type, block.content || '', JSON.stringify(block.properties || {}), block.position || 0);
      }
    }
  });

  try {
    tx();
    // Rename old file to mark migration complete
    fs.renameSync(jsonPath, jsonPath + '.migrated');
    console.log('✅ Migração concluída! data.json renomeado para data.json.migrated');
    return true;
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    return false;
  }
}

// ── Seed default users if DB is empty ───────────────────────
function seedUsers(bcryptHashSync) {
  const d = getDb();
  const count = d.prepare('SELECT COUNT(*) as c FROM users').get();
  if (count.c > 0) return;

  console.log('🌱 Criando usuários padrão...');
  const hash = bcryptHashSync('Concordbot', 10);

  const insert = d.prepare('INSERT INTO users (id, email, display_name, password_hash, name) VALUES (?,?,?,?,?)');
  const users = [
    ['u-gidao', 'gidao@concord.app', 'Gidão', hash, 'gidao'],
    ['u-isadora', 'isadora@concord.app', 'Isadora', hash, 'isadora'],
    ['u-ranniere', 'ranniere@concord.app', 'Ranniere', hash, 'ranniere'],
    ['u-isaac', 'isaac@concord.app', 'Isaac', hash, 'isaac'],
    ['u-clemerson', 'clemerson@concord.app', 'Clemerson', hash, 'clemerson'],
  ];

  const tx = d.transaction(() => {
    for (const u of users) insert.run(...u);
  });
  tx();

  // Create default Zyntra workspace
  const wsId = 'ws-zyntra';
  d.prepare('INSERT INTO workspaces (id, name, icon, description, owner_id) VALUES (?,?,?,?,?)').run(wsId, 'Zyntra', '⚡', 'Equipe principal do Concord', 'u-gidao');

  const insertMember = d.prepare('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?,?,?)');
  insertMember.run(wsId, 'u-gidao', 'owner');
  for (const u of users.slice(1)) insertMember.run(wsId, u[0], 'member');

  const insertCh = d.prepare('INSERT INTO channels (id, workspace_id, name, description, type) VALUES (?,?,?,?,?)');
  insertCh.run('ch-zyntra-general', wsId, 'general', 'Discussão geral', 'text');
  insertCh.run('ch-zyntra-random', wsId, 'random', 'Bate-papo', 'text');
  insertCh.run('ch-zyntra-anuncios', wsId, 'anúncios', 'Comunicados importantes', 'announcement');
  insertCh.run('ch-zyntra-voice', wsId, 'Bate-papo de Voz', 'Canal de voz', 'voice');

  console.log('✅ Workspace Zyntra criada com 5 usuários');
}

function generateTokenId() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = { getDb, migrateFromJson, seedUsers, generateTokenId };
