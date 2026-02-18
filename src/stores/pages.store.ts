import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableSync } from './sync.middleware';
import type { Page, Block, BlockType, ID } from '@/types';
import { generateId } from '@/lib/utils';

interface PagesStore {
  pages: Page[];
  favorites: ID[];

  // ── Page CRUD ──
  createPage: (workspaceId: ID, title: string, icon?: string, parentId?: ID) => ID;
  deletePage: (pageId: ID) => void;
  renamePage: (pageId: ID, title: string) => void;
  setPageIcon: (pageId: ID, icon: string) => void;
  setPageCover: (pageId: ID, cover: string) => void;
  getPageById: (pageId: ID) => Page | undefined;
  getPagesByWorkspace: (workspaceId: ID) => Page[];
  getChildPages: (parentId: ID) => Page[];
  getRootPages: (workspaceId: ID) => Page[];

  // ── Block CRUD ──
  addBlock: (pageId: ID, type: BlockType, afterBlockId?: ID) => ID;
  deleteBlock: (pageId: ID, blockId: ID) => void;
  updateBlockContent: (pageId: ID, blockId: ID, content: string) => void;
  updateBlockProperties: (pageId: ID, blockId: ID, props: Record<string, unknown>) => void;
  changeBlockType: (pageId: ID, blockId: ID, newType: BlockType) => void;
  moveBlock: (pageId: ID, blockId: ID, newIndex: number) => void;
  toggleBlockChecked: (pageId: ID, blockId: ID) => void;
  toggleBlockCollapsed: (pageId: ID, blockId: ID) => void;

  // ── Favorites ──
  toggleFavorite: (pageId: ID) => void;
  isFavorite: (pageId: ID) => boolean;

  // ── Reset ──
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
            blocks: [
              {
                id: generateId(),
                pageId: id,
                type: 'paragraph',
                content: '',
                position: 0,
                properties: {},
              },
            ],
            parentId: parentId ?? undefined,
            children: [],
            isFavorite: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastEditedBy: '',
          });

          // Register as child if nested
          if (parentId) {
            const parent = s.pages.find((p) => p.id === parentId);
            if (parent) parent.children.push(id);
          }
        });
        return id;
      },

      deletePage: (pageId) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;

          // Remove from parent's children list
          if (page.parentId) {
            const parent = s.pages.find((p) => p.id === page.parentId);
            if (parent) {
              parent.children = parent.children.filter((id) => id !== pageId);
            }
          }

          // Recursively collect IDs to delete (page + descendants)
          const idsToDelete: ID[] = [];
          const collectIds = (id: ID) => {
            idsToDelete.push(id);
            const pg = s.pages.find((p) => p.id === id);
            pg?.children.forEach(collectIds);
          };
          collectIds(pageId);

          s.pages = s.pages.filter((p) => !idsToDelete.includes(p.id));
          s.favorites = s.favorites.filter((id) => !idsToDelete.includes(id));
        }),

      renamePage: (pageId, title) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (page) {
            page.title = title;
            page.updatedAt = Date.now();
          }
        }),

      setPageIcon: (pageId, icon) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (page) {
            page.icon = icon;
            page.updatedAt = Date.now();
          }
        }),

      setPageCover: (pageId, cover) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (page) {
            page.coverImage = cover;
            page.updatedAt = Date.now();
          }
        }),

      getPageById: (pageId) => get().pages.find((p) => p.id === pageId),

      getPagesByWorkspace: (workspaceId) =>
        get().pages.filter((p) => p.workspaceId === workspaceId),

      getChildPages: (parentId) =>
        get().pages.filter((p) => p.parentId === parentId),

      getRootPages: (workspaceId) =>
        get().pages.filter((p) => p.workspaceId === workspaceId && !p.parentId),

      // ── Block CRUD ──
      addBlock: (pageId, type, afterBlockId) => {
        const blockId = generateId();
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;

          const newBlock: Block = {
            id: blockId,
            pageId,
            type,
            content: '',
            position: page.blocks.length,
            properties: type === 'todo' ? { checked: false } : {},
          };

          if (afterBlockId) {
            const idx = page.blocks.findIndex((b) => b.id === afterBlockId);
            if (idx >= 0) {
              page.blocks.splice(idx + 1, 0, newBlock);
            } else {
              page.blocks.push(newBlock);
            }
          } else {
            page.blocks.push(newBlock);
          }

          page.blocks.forEach((b, i) => (b.position = i));
          page.updatedAt = Date.now();
        });
        return blockId;
      },

      deleteBlock: (pageId, blockId) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;
          // Never delete the last block — keep at least one
          if (page.blocks.length <= 1) {
            page.blocks[0].content = '';
            page.blocks[0].type = 'paragraph';
            return;
          }
          page.blocks = page.blocks.filter((b) => b.id !== blockId);
          page.blocks.forEach((b, i) => (b.position = i));
          page.updatedAt = Date.now();
        }),

      updateBlockContent: (pageId, blockId, content) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.content = content;
            page.updatedAt = Date.now();
          }
        }),

      updateBlockProperties: (pageId, blockId, props) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.properties = { ...block.properties, ...props };
            page.updatedAt = Date.now();
          }
        }),

      changeBlockType: (pageId, blockId, newType) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.type = newType;
            if (newType === 'todo') block.properties = { checked: false, ...block.properties };
            page.updatedAt = Date.now();
          }
        }),

      moveBlock: (pageId, blockId, newIndex) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          if (!page) return;
          const oldIndex = page.blocks.findIndex((b) => b.id === blockId);
          if (oldIndex === -1) return;
          const [block] = page.blocks.splice(oldIndex, 1);
          page.blocks.splice(newIndex, 0, block);
          page.blocks.forEach((b, i) => (b.position = i));
          page.updatedAt = Date.now();
        }),

      toggleBlockChecked: (pageId, blockId) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.properties = {
              ...block.properties,
              checked: !block.properties.checked,
            };
            page.updatedAt = Date.now();
          }
        }),

      toggleBlockCollapsed: (pageId, blockId) =>
        set((s) => {
          const page = s.pages.find((p) => p.id === pageId);
          const block = page?.blocks.find((b) => b.id === blockId);
          if (block && page) {
            block.properties = {
              ...block.properties,
              collapsed: !block.properties.collapsed,
            };
            page.updatedAt = Date.now();
          }
        }),

      // ── Favorites ──
      toggleFavorite: (pageId) =>
        set((s) => {
          const idx = s.favorites.indexOf(pageId);
          if (idx >= 0) {
            s.favorites.splice(idx, 1);
          } else {
            s.favorites.push(pageId);
          }
          const page = s.pages.find((p) => p.id === pageId);
          if (page) page.isFavorite = !page.isFavorite;
        }),

      isFavorite: (pageId) => get().favorites.includes(pageId),

      reset: () =>
        set(() => ({
          pages: [],
          favorites: [],
        })),
    })),
    { name: 'concord-pages' },
  ),
);

enableSync(usePagesStore, 'pages');
