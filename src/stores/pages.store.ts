import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { syncManager } from './sync.middleware';
import { api } from '@/lib/api';
import type { Page, Block, BlockType, ID } from '@/types';
import { generateId } from '@/lib/utils';

interface PagesStore {
  pages: Page[];
  favorites: ID[];

  // Page CRUD
  createPage: (workspaceId: ID, title: string, icon?: string, parentId?: ID) => ID;
  deletePage: (pageId: ID) => void;
  renamePage: (pageId: ID, title: string) => void;
  setPageIcon: (pageId: ID, icon: string) => void;
  setPageCover: (pageId: ID, cover: string) => void;
  getPageById: (pageId: ID) => Page | undefined;
  getPagesByWorkspace: (workspaceId: ID) => Page[];
  getChildPages: (parentId: ID) => Page[];
  getRootPages: (workspaceId: ID) => Page[];

  // Block CRUD
  addBlock: (pageId: ID, type: BlockType, afterBlockId?: ID) => ID;
  deleteBlock: (pageId: ID, blockId: ID) => void;
  updateBlockContent: (pageId: ID, blockId: ID, content: string) => void;
  updateBlockProperties: (pageId: ID, blockId: ID, props: Record<string, unknown>) => void;
  changeBlockType: (pageId: ID, blockId: ID, newType: BlockType) => void;
  moveBlock: (pageId: ID, blockId: ID, newIndex: number) => void;
  toggleBlockChecked: (pageId: ID, blockId: ID) => void;
  toggleBlockCollapsed: (pageId: ID, blockId: ID) => void;

  // Favorites
  toggleFavorite: (pageId: ID) => void;
  isFavorite: (pageId: ID) => boolean;

  // API Hydration
  loadPages: (workspaceId: ID) => Promise<void>;
  reset: () => void;
}

export const usePagesStore = create<PagesStore>()(
  persist(
    immer((set, get) => ({
      pages: [],
      favorites: [],

      // ── Page CRUD ──
      createPage: (workspaceId, title, icon, parentId) => {
        const id = generateId();
        set((s) => {
          s.pages.push({
            id,
            workspaceId,
            title,
            icon: icon ?? '📄',
            coverImage: '',
            blocks: [{ id: generateId(), pageId: id, type: 'paragraph', content: '', position: 0, properties: {} }],
            parentId: parentId ?? undefined,
            children: [],
            isFavorite: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastEditedBy: '',
          });
          if (parentId) {
            const parent = s.pages.find((p) => p.id === parentId);
            if (parent) parent.children.push(id);
          }
        });
        api.post(`/workspaces/${workspaceId}/pages`, { id, title, icon, parentId }).catch(() => {});
        return id;
      },

      deletePage: (pageId) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;
          if (page.parentId) {
            const parent = s.pages.find((p) => p.id === page.parentId);
            if (parent) parent.children = parent.children.filter((id) => id !== pageId);
          }
          const idsToDelete: ID[] = [];
          const collectIds = (id: ID) => {
            idsToDelete.push(id);
            s.pages.find((p) => p.id === id)?.children.forEach(collectIds);
          };
          collectIds(pageId);
          s.pages = s.pages.filter((p) => !idsToDelete.includes(p.id));
          s.favorites = s.favorites.filter((id) => !idsToDelete.includes(id));
        });
        api.delete(`/pages/${pageId}`).catch(() => {});
      },

      renamePage: (pageId, title) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (page) { page.title = title; page.updatedAt = Date.now(); }
        });
        api.patch(`/pages/${pageId}`, { title }).catch(() => {});
      },

      setPageIcon: (pageId, icon) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (page) { page.icon = icon; page.updatedAt = Date.now(); }
        });
        api.patch(`/pages/${pageId}`, { icon }).catch(() => {});
      },

      setPageCover: (pageId, cover) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (page) { page.coverImage = cover; page.updatedAt = Date.now(); }
        });
        api.patch(`/pages/${pageId}`, { coverImage: cover }).catch(() => {});
      },

      getPageById: (pageId) => get().pages.find((p) => p.id === pageId),
      getPagesByWorkspace: (workspaceId) => get().pages.filter((p) => p.workspaceId === workspaceId),
      getChildPages: (parentId) => get().pages.filter((p) => p.parentId === parentId),
      getRootPages: (workspaceId) => get().pages.filter((p) => p.workspaceId === workspaceId && !p.parentId),

      // ── Block CRUD ──
      addBlock: (pageId, type, afterBlockId) => {
        const blockId = generateId();
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;
          const newBlock: Block = {
            id: blockId, pageId, type, content: '', position: page.blocks.length,
            properties: type === 'todo' ? { checked: false } : {},
          };
          if (afterBlockId) {
            const idx = page.blocks.findIndex((b) => b.id === afterBlockId);
            if (idx >= 0) page.blocks.splice(idx + 1, 0, newBlock);
            else page.blocks.push(newBlock);
          } else {
            page.blocks.push(newBlock);
          }
          page.blocks.forEach((b, i) => (b.position = i));
          page.updatedAt = Date.now();
        });
        api.post(`/pages/${pageId}/blocks`, { id: blockId, type, afterBlockId }).catch(() => {});
        return blockId;
      },

      deleteBlock: (pageId, blockId) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;
          if (page.blocks.length <= 1) {
            page.blocks[0].content = '';
            page.blocks[0].type = 'paragraph';
            return;
          }
          page.blocks = page.blocks.filter((b) => b.id !== blockId);
          page.blocks.forEach((b, i) => (b.position = i));
          page.updatedAt = Date.now();
        });
        api.delete(`/blocks/${blockId}`).catch(() => {});
      },

      updateBlockContent: (pageId, blockId, content) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) { block.content = content; page.updatedAt = Date.now(); }
        });
        api.patch(`/blocks/${blockId}`, { content }).catch(() => {});
      },

      updateBlockProperties: (pageId, blockId, props) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) { block.properties = { ...block.properties, ...props }; page.updatedAt = Date.now(); }
        });
        api.patch(`/blocks/${blockId}`, { properties: props }).catch(() => {});
      },

      changeBlockType: (pageId, blockId, newType) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.type = newType;
            if (newType === 'todo') block.properties = { checked: false, ...block.properties };
            page.updatedAt = Date.now();
          }
        });
        api.patch(`/blocks/${blockId}`, { type: newType }).catch(() => {});
      },

      moveBlock: (pageId, blockId, newIndex) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;
          const oldIndex = page.blocks.findIndex((b) => b.id === blockId);
          if (oldIndex === -1) return;
          const [block] = page.blocks.splice(oldIndex, 1);
          page.blocks.splice(newIndex, 0, block);
          page.blocks.forEach((b, i) => (b.position = i));
          page.updatedAt = Date.now();
        });
        // The server will reorder when we send the full page update
      },

      toggleBlockChecked: (pageId, blockId) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.properties = { ...block.properties, checked: !block.properties.checked };
            page.updatedAt = Date.now();
          }
        });
        const page = get().pages.find((p) => p.id === pageId);
        const block = page?.blocks.find((b) => b.id === blockId);
        if (block) api.patch(`/blocks/${blockId}`, { properties: { checked: block.properties.checked } }).catch(() => {});
      },

      toggleBlockCollapsed: (pageId, blockId) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.properties = { ...block.properties, collapsed: !block.properties.collapsed };
            page.updatedAt = Date.now();
          }
        });
        const page = get().pages.find((p) => p.id === pageId);
        const block = page?.blocks.find((b) => b.id === blockId);
        if (block) api.patch(`/blocks/${blockId}`, { properties: { collapsed: block.properties.collapsed } }).catch(() => {});
      },

      // ── Favorites ──
      toggleFavorite: (pageId) => {
        set((s) => {
          const idx = s.favorites.indexOf(pageId);
          if (idx >= 0) s.favorites.splice(idx, 1);
          else s.favorites.push(pageId);
          const page = s.pages.find((p) => p.id === pageId);
          if (page) page.isFavorite = !page.isFavorite;
        });
        const page = get().pages.find((p) => p.id === pageId);
        if (page) api.patch(`/pages/${pageId}`, { isFavorite: page.isFavorite }).catch(() => {});
      },

      isFavorite: (pageId) => get().favorites.includes(pageId),

      // ── API Hydration ──
      loadPages: async (workspaceId) => {
        try {
          const pages = await api.get<Page[]>(`/workspaces/${workspaceId}/pages`);
          if (pages && pages.length >= 0) {
            set((s) => {
              s.pages = [...s.pages.filter((p) => p.workspaceId !== workspaceId), ...pages];
              // Rebuild favorites list from server data
              s.favorites = s.pages.filter((p) => p.isFavorite).map((p) => p.id);
            });
          }
        } catch {
          // Keep local data
        }
      },

      reset: () => set(() => ({ pages: [], favorites: [] })),
    })),
    { name: 'concord-pages' },
  ),
);

// ═══════════════════════════════════════════════════════════════
// WebSocket Event Handlers — apply remote page changes
// ═══════════════════════════════════════════════════════════════

syncManager.on('page:created', (data) => {
  const page = (data as { page: Page }).page;
  if (!page) return;
  usePagesStore.setState((s) => {
    if (!s.pages.some((p) => p.id === page.id)) {
      s.pages.push(page);
    }
  });
});

syncManager.on('page:updated', (data) => {
  const page = (data as { page: Page }).page;
  if (!page) return;
  usePagesStore.setState((s) => {
    const idx = s.pages.findIndex((p) => p.id === page.id);
    if (idx >= 0) {
      s.pages[idx] = page;
    }
  });
});

syncManager.on('page:deleted', (data) => {
  const { pageIds } = data as { pageIds: string[] };
  if (!pageIds) return;
  usePagesStore.setState((s) => {
    s.pages = s.pages.filter((p) => !pageIds.includes(p.id));
    s.favorites = s.favorites.filter((id) => !pageIds.includes(id));
  });
});
