import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AppView, NavigationState, ID } from '@/types';

interface NavigationStore extends NavigationState {
  setView: (view: AppView) => void;
  setActiveWorkspace: (id: ID | null) => void;
  setActiveChannel: (id: ID | null) => void;
  setActiveBoard: (id: ID | null) => void;
  setActivePage: (id: ID | null) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

const initialState: NavigationState = {
  currentView: 'chat',
  activeWorkspaceId: null,
  activeChannelId: null,
  activeBoardId: null,
  activePageId: null,
  sidebarCollapsed: false,
};

export const useNavigationStore = create<NavigationStore>()(
  persist(
    immer((set) => ({
      ...initialState,

      setView: (view) =>
        set((s) => {
          s.currentView = view;
        }),

      setActiveWorkspace: (id) =>
        set((s) => {
          s.activeWorkspaceId = id;
          s.activeChannelId = null;
          s.activeBoardId = null;
          s.activePageId = null;
        }),

      setActiveChannel: (id) =>
        set((s) => {
          s.activeChannelId = id;
        }),

      setActiveBoard: (id) =>
        set((s) => {
          s.activeBoardId = id;
        }),

      setActivePage: (id) =>
        set((s) => {
          s.activePageId = id;
        }),

      toggleSidebar: () =>
        set((s) => {
          s.sidebarCollapsed = !s.sidebarCollapsed;
        }),

      reset: () => set(() => ({ ...initialState })),
    })),
    { name: 'concord-nav' },
  ),
);
