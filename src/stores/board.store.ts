import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { syncManager } from './sync.middleware';
import { api } from '@/lib/api';
import type { Board, Card, ID, Label, Priority } from '@/types';
import { generateId } from '@/lib/utils';

interface BoardStore {
  boards: Board[];

  // Board CRUD
  createBoard: (workspaceId: ID, title: string) => ID;
  deleteBoard: (boardId: ID) => void;
  renameBoard: (boardId: ID, title: string) => void;
  getBoardById: (boardId: ID) => Board | undefined;
  getBoardsByWorkspace: (workspaceId: ID) => Board[];

  // Column CRUD
  createColumn: (boardId: ID, title: string) => void;
  deleteColumn: (boardId: ID, columnId: ID) => void;
  renameColumn: (boardId: ID, columnId: ID, title: string) => void;
  moveColumn: (boardId: ID, columnId: ID, newIndex: number) => void;

  // Card CRUD
  createCard: (boardId: ID, columnId: ID, title: string) => void;
  deleteCard: (boardId: ID, columnId: ID, cardId: ID) => void;
  updateCard: (boardId: ID, columnId: ID, cardId: ID, updates: Partial<Card>) => void;
  moveCard: (boardId: ID, fromColumnId: ID, toColumnId: ID, cardId: ID, newIndex: number) => void;

  // Card Details
  setCardDescription: (boardId: ID, columnId: ID, cardId: ID, description: string) => void;
  setCardPriority: (boardId: ID, columnId: ID, cardId: ID, priority: Priority) => void;
  setCardDueDate: (boardId: ID, columnId: ID, cardId: ID, dueDate: number | null) => void;
  toggleCardLabel: (boardId: ID, columnId: ID, cardId: ID, label: Label) => void;
  setCardAssignees: (boardId: ID, columnId: ID, cardId: ID, assignees: ID[]) => void;

  // Checklist
  addChecklistItem: (boardId: ID, columnId: ID, cardId: ID, text: string) => void;
  toggleChecklistItem: (boardId: ID, columnId: ID, cardId: ID, itemId: ID) => void;
  deleteChecklistItem: (boardId: ID, columnId: ID, cardId: ID, itemId: ID) => void;
  renameChecklistItem: (boardId: ID, columnId: ID, cardId: ID, itemId: ID, text: string) => void;

  // Comments
  addComment: (boardId: ID, columnId: ID, cardId: ID, content: string, authorId: ID) => void;
  deleteComment: (boardId: ID, columnId: ID, cardId: ID, commentId: ID) => void;

  // API Hydration
  loadBoards: (workspaceId: ID) => Promise<void>;
  reset: () => void;
}

function findCard(boards: Board[], boardId: ID, columnId: ID, cardId: ID): Card | undefined {
  const board = boards.find((b) => b.id === boardId);
  const col = board?.columns.find((c) => c.id === columnId);
  return col?.cards.find((card) => card.id === cardId);
}

const DEFAULT_LABELS: Label[] = [
  { id: 'lb-bug', name: 'Bug', color: '#ef4444' },
  { id: 'lb-feature', name: 'Funcionalidade', color: '#8b5cf6' },
  { id: 'lb-improvement', name: 'Melhoria', color: '#06b6d4' },
  { id: 'lb-docs', name: 'Documentação', color: '#f59e0b' },
  { id: 'lb-urgent', name: 'Urgente', color: '#f97316' },
  { id: 'lb-design', name: 'Design', color: '#ec4899' },
];

export const useBoardStore = create<BoardStore>()(
  persist(
    immer((set, get) => ({
      boards: [],

      // ── Board CRUD ──
      createBoard: (workspaceId, title) => {
        const id = generateId();
        set((s) => {
          s.boards.push({
            id,
            workspaceId,
            title,
            columns: [
              { id: generateId(), boardId: id, title: 'A Fazer', cards: [], position: 0 },
              { id: generateId(), boardId: id, title: 'Em Progresso', cards: [], position: 1 },
              { id: generateId(), boardId: id, title: 'Concluído', cards: [], position: 2 },
            ],
            labels: DEFAULT_LABELS,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        });
        api.post(`/workspaces/${workspaceId}/boards`, { id, title }).then((board) => {
          // Replace optimistic with server data
          if (board) set((s) => { const idx = s.boards.findIndex(b => b.id === id); if (idx >= 0) s.boards[idx] = board as Board; });
        }).catch(() => {});
        return id;
      },

      deleteBoard: (boardId) => {
        set((s) => { s.boards = s.boards.filter((b) => b.id !== boardId); });
        api.delete(`/boards/${boardId}`).catch(() => {});
      },

      renameBoard: (boardId, title) => {
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          if (board) { board.title = title; board.updatedAt = Date.now(); }
        });
        api.patch(`/boards/${boardId}`, { title }).catch(() => {});
      },

      getBoardById: (boardId) => get().boards.find((b) => b.id === boardId),
      getBoardsByWorkspace: (workspaceId) => get().boards.filter((b) => b.workspaceId === workspaceId),

      // ── Column CRUD ──
      createColumn: (boardId, title) => {
        const colId = generateId();
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          if (!board) return;
          board.columns.push({ id: colId, boardId, title, cards: [], position: board.columns.length });
          board.updatedAt = Date.now();
        });
        api.post(`/boards/${boardId}/columns`, { id: colId, title }).catch(() => {});
      },

      deleteColumn: (boardId, columnId) => {
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          if (!board) return;
          board.columns = board.columns.filter((c) => c.id !== columnId);
          board.columns.forEach((c, i) => (c.position = i));
          board.updatedAt = Date.now();
        });
        api.delete(`/columns/${columnId}`).catch(() => {});
      },

      renameColumn: (boardId, columnId, title) => {
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          const col = board?.columns.find((c) => c.id === columnId);
          if (col && board) { col.title = title; board.updatedAt = Date.now(); }
        });
        api.patch(`/columns/${columnId}`, { title }).catch(() => {});
      },

      moveColumn: (boardId, columnId, newIndex) => {
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          if (!board) return;
          const oldIndex = board.columns.findIndex((c) => c.id === columnId);
          if (oldIndex === -1) return;
          const [col] = board.columns.splice(oldIndex, 1);
          board.columns.splice(newIndex, 0, col);
          board.columns.forEach((c, i) => (c.position = i));
          board.updatedAt = Date.now();
        });
        api.patch(`/columns/${columnId}`, { position: newIndex }).catch(() => {});
      },

      // ── Card CRUD ──
      createCard: (boardId, columnId, title) => {
        const cardId = generateId();
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          const col = board?.columns.find((c) => c.id === columnId);
          if (!col || !board) return;
          col.cards.push({
            id: cardId, columnId, title, description: '', assignees: [], labels: [],
            priority: 'none', checklist: [], comments: [], attachments: [],
            position: col.cards.length, createdAt: Date.now(), updatedAt: Date.now(),
          });
          board.updatedAt = Date.now();
        });
        api.post(`/columns/${columnId}/cards`, { id: cardId, title, boardId }).catch(() => {});
      },

      deleteCard: (boardId, columnId, cardId) => {
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          const col = board?.columns.find((c) => c.id === columnId);
          if (!col || !board) return;
          col.cards = col.cards.filter((c) => c.id !== cardId);
          col.cards.forEach((c, i) => (c.position = i));
          board.updatedAt = Date.now();
        });
        api.delete(`/cards/${cardId}`).catch(() => {});
      },

      updateCard: (boardId, columnId, cardId, updates) => {
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          if (!card) return;
          Object.assign(card, { ...updates, updatedAt: Date.now() });
        });
        api.patch(`/cards/${cardId}`, updates).catch(() => {});
      },

      moveCard: (boardId, fromColumnId, toColumnId, cardId, newIndex) => {
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          if (!board) return;
          const fromCol = board.columns.find((c) => c.id === fromColumnId);
          const toCol = board.columns.find((c) => c.id === toColumnId);
          if (!fromCol || !toCol) return;
          const cardIndex = fromCol.cards.findIndex((c) => c.id === cardId);
          if (cardIndex === -1) return;
          const [card] = fromCol.cards.splice(cardIndex, 1);
          card.columnId = toColumnId;
          toCol.cards.splice(newIndex, 0, card);
          fromCol.cards.forEach((c, i) => (c.position = i));
          toCol.cards.forEach((c, i) => (c.position = i));
          board.updatedAt = Date.now();
        });
        api.patch(`/cards/${cardId}/move`, { toColumnId, position: newIndex }).catch(() => {});
      },

      // ── Card Details ──
      setCardDescription: (boardId, columnId, cardId, description) => {
        set((s) => { const card = findCard(s.boards, boardId, columnId, cardId); if (card) { card.description = description; card.updatedAt = Date.now(); } });
        api.patch(`/cards/${cardId}`, { description }).catch(() => {});
      },

      setCardPriority: (boardId, columnId, cardId, priority) => {
        set((s) => { const card = findCard(s.boards, boardId, columnId, cardId); if (card) { card.priority = priority; card.updatedAt = Date.now(); } });
        api.patch(`/cards/${cardId}`, { priority }).catch(() => {});
      },

      setCardDueDate: (boardId, columnId, cardId, dueDate) => {
        set((s) => { const card = findCard(s.boards, boardId, columnId, cardId); if (card) { card.dueDate = dueDate ?? undefined; card.updatedAt = Date.now(); } });
        api.patch(`/cards/${cardId}`, { dueDate }).catch(() => {});
      },

      toggleCardLabel: (boardId, columnId, cardId, label) => {
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          if (!card) return;
          const idx = card.labels.findIndex((l) => l.id === label.id);
          if (idx >= 0) card.labels.splice(idx, 1);
          else card.labels.push(label);
          card.updatedAt = Date.now();
        });
        // Send full labels array to server
        const card = findCard(get().boards, boardId, columnId, cardId);
        if (card) api.patch(`/cards/${cardId}`, { labels: card.labels }).catch(() => {});
      },

      setCardAssignees: (boardId, columnId, cardId, assignees) => {
        set((s) => { const card = findCard(s.boards, boardId, columnId, cardId); if (card) { card.assignees = assignees; card.updatedAt = Date.now(); } });
        api.patch(`/cards/${cardId}`, { assignees }).catch(() => {});
      },

      // ── Checklist ──
      addChecklistItem: (boardId, columnId, cardId, text) => {
        const itemId = generateId();
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          if (!card) return;
          card.checklist.push({ id: itemId, text, isCompleted: false });
          card.updatedAt = Date.now();
        });
        const card = findCard(get().boards, boardId, columnId, cardId);
        if (card) api.patch(`/cards/${cardId}`, { checklist: card.checklist }).catch(() => {});
      },

      toggleChecklistItem: (boardId, columnId, cardId, itemId) => {
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          const item = card?.checklist.find((i) => i.id === itemId);
          if (item) { item.isCompleted = !item.isCompleted; if (card) card.updatedAt = Date.now(); }
        });
        const card = findCard(get().boards, boardId, columnId, cardId);
        if (card) api.patch(`/cards/${cardId}`, { checklist: card.checklist }).catch(() => {});
      },

      deleteChecklistItem: (boardId, columnId, cardId, itemId) => {
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          if (!card) return;
          card.checklist = card.checklist.filter((i) => i.id !== itemId);
          card.updatedAt = Date.now();
        });
        const card = findCard(get().boards, boardId, columnId, cardId);
        if (card) api.patch(`/cards/${cardId}`, { checklist: card.checklist }).catch(() => {});
      },

      renameChecklistItem: (boardId, columnId, cardId, itemId, text) => {
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          const item = card?.checklist.find((i) => i.id === itemId);
          if (item) { item.text = text; if (card) card.updatedAt = Date.now(); }
        });
        const card = findCard(get().boards, boardId, columnId, cardId);
        if (card) api.patch(`/cards/${cardId}`, { checklist: card.checklist }).catch(() => {});
      },

      // ── Comments ──
      addComment: (boardId, columnId, cardId, content, authorId) => {
        const commentId = generateId();
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          if (!card) return;
          card.comments.push({ id: commentId, cardId, authorId, content, createdAt: Date.now() });
          card.updatedAt = Date.now();
        });
        api.post(`/cards/${cardId}/comments`, { id: commentId, content }).catch(() => {});
      },

      deleteComment: (boardId, columnId, cardId, commentId) => {
        set((s) => {
          const card = findCard(s.boards, boardId, columnId, cardId);
          if (!card) return;
          card.comments = card.comments.filter((c) => c.id !== commentId);
          card.updatedAt = Date.now();
        });
        api.delete(`/cards/${cardId}/comments/${commentId}`).catch(() => {});
      },

      // ── API Hydration ──
      loadBoards: async (workspaceId) => {
        try {
          const boards = await api.get<Board[]>(`/workspaces/${workspaceId}/boards`);
          if (boards && boards.length >= 0) {
            set((s) => {
              // Replace boards for this workspace, keep others
              s.boards = [...s.boards.filter((b) => b.workspaceId !== workspaceId), ...boards];
            });
          }
        } catch {
          // Keep local data
        }
      },

      reset: () => set(() => ({ boards: [] })),
    })),
    { name: 'concord-boards' },
  ),
);

// ═══════════════════════════════════════════════════════════════
// WebSocket Event Handlers — apply remote board changes
// ═══════════════════════════════════════════════════════════════

syncManager.on('board:created', (data) => {
  const board = (data as { board: Board }).board;
  if (!board) return;
  useBoardStore.setState((s) => {
    if (!s.boards.some((b) => b.id === board.id)) {
      s.boards.push(board);
    }
  });
});

syncManager.on('board:updated', (data) => {
  const board = (data as { board: Board }).board;
  if (!board) return;
  useBoardStore.setState((s) => {
    const idx = s.boards.findIndex((b) => b.id === board.id);
    if (idx >= 0) {
      s.boards[idx] = board;
    }
  });
});

syncManager.on('board:deleted', (data) => {
  const { boardId } = data as { boardId: string };
  useBoardStore.setState((s) => {
    s.boards = s.boards.filter((b) => b.id !== boardId);
  });
});
