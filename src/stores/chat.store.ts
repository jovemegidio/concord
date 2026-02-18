import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableSync } from './sync.middleware';
import type { User, Workspace, Channel, Message, ID, ChannelType, UserStatus } from '@/types';
import { generateId } from '@/lib/utils';

// ── Predefined Users ────────────────────────────────────────
export const CONCORD_USERS: User[] = [
  { id: 'u-gidao', name: 'gidao', displayName: 'Gidão', avatar: '', status: 'online', customStatus: '', aboutMe: '', banner: '', email: 'gidao@concord.app', createdAt: 0 },
  { id: 'u-isadora', name: 'isadora', displayName: 'Isadora', avatar: '', status: 'online', customStatus: '', aboutMe: '', banner: '', email: 'isadora@concord.app', createdAt: 0 },
  { id: 'u-ranniere', name: 'ranniere', displayName: 'Ranniere', avatar: '', status: 'online', customStatus: '', aboutMe: '', banner: '', email: 'ranniere@concord.app', createdAt: 0 },
  { id: 'u-isaac', name: 'isaac', displayName: 'Isaac', avatar: '', status: 'online', customStatus: '', aboutMe: '', banner: '', email: 'isaac@concord.app', createdAt: 0 },
];

export const CONCORD_PASSWORD = 'Concordbot';

// ── Zyntra: Fixed default workspace for all users ───────────
export const ZYNTRA_WORKSPACE_ID = 'ws-zyntra';

function createZyntraWorkspace(): Workspace {
  return {
    id: ZYNTRA_WORKSPACE_ID,
    name: 'Zyntra',
    icon: '⚡',
    description: 'Equipe principal do Concord',
    banner: '',
    ownerId: 'u-gidao',
    members: CONCORD_USERS.map((u, i) => ({
      userId: u.id,
      role: i === 0 ? 'owner' as const : 'member' as const,
      joinedAt: 0,
    })),
    channels: [
      { id: 'ch-zyntra-general', workspaceId: ZYNTRA_WORKSPACE_ID, name: 'general', description: 'Discussão geral', type: 'text', messages: [], pinnedMessageIds: [], createdAt: 0 },
      { id: 'ch-zyntra-random', workspaceId: ZYNTRA_WORKSPACE_ID, name: 'random', description: 'Bate-papo', type: 'text', messages: [], pinnedMessageIds: [], createdAt: 0 },
      { id: 'ch-zyntra-anuncios', workspaceId: ZYNTRA_WORKSPACE_ID, name: 'anúncios', description: 'Comunicados importantes', type: 'announcement', messages: [], pinnedMessageIds: [], createdAt: 0 },
      { id: 'ch-zyntra-voice', workspaceId: ZYNTRA_WORKSPACE_ID, name: 'Bate-papo de Voz', description: 'Canal de voz', type: 'voice', messages: [], pinnedMessageIds: [], createdAt: 0 },
    ],
    boards: [],
    pages: [],
    createdAt: 0,
  };
}

// ── Voice state per channel ─────────────────────────────────
export interface VoiceConnection {
  channelId: ID;
  userId: ID;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface ChatStore {
  // ── State ──
  currentUser: User | null;
  workspaces: Workspace[];
  voiceConnections: VoiceConnection[];
  typingUsers: Record<ID, ID[]>;

  // ── User ──
  loginAs: (userId: ID) => void;
  logout: () => void;
  updateUserStatus: (status: UserStatus) => void;
  updateProfile: (updates: Partial<Pick<User, 'displayName' | 'avatar' | 'customStatus' | 'aboutMe' | 'banner'>>) => void;
  getCurrentUser: () => User | null;
  getUserById: (id: ID) => User | undefined;

  // ── Workspace ──
  createWorkspace: (name: string, icon: string) => ID;
  deleteWorkspace: (id: ID) => void;
  renameWorkspace: (id: ID, name: string) => void;
  updateWorkspace: (id: ID, updates: Partial<Pick<Workspace, 'name' | 'icon' | 'iconImage' | 'description' | 'banner'>>) => void;
  getWorkspaceById: (id: ID) => Workspace | undefined;

  // ── Channel ──
  createChannel: (workspaceId: ID, name: string, type: ChannelType, description?: string) => ID;
  deleteChannel: (workspaceId: ID, channelId: ID) => void;
  renameChannel: (workspaceId: ID, channelId: ID, name: string) => void;
  updateChannelDescription: (workspaceId: ID, channelId: ID, desc: string) => void;
  getChannelById: (workspaceId: ID, channelId: ID) => Channel | undefined;
  getChannelMessages: (workspaceId: ID, channelId: ID) => Message[];

  // ── Message ──
  sendMessage: (workspaceId: ID, channelId: ID, content: string) => void;
  editMessage: (workspaceId: ID, channelId: ID, messageId: ID, newContent: string) => void;
  deleteMessage: (workspaceId: ID, channelId: ID, messageId: ID) => void;
  toggleReaction: (workspaceId: ID, channelId: ID, messageId: ID, emoji: string) => void;
  togglePinMessage: (workspaceId: ID, channelId: ID, messageId: ID) => void;

  // ── Voice ──
  joinVoiceChannel: (channelId: ID) => void;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  getVoiceChannel: () => ID | null;
  getVoiceUsers: (channelId: ID) => VoiceConnection[];
  setSpeaking: (userId: ID, speaking: boolean) => void;

  // ── Typing ──
  setTyping: (channelId: ID, isTyping: boolean) => void;

  // ── Reset ──
  reset: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      currentUser: null,
      workspaces: [],
      voiceConnections: [],
      typingUsers: {},

      // ── User ──
      loginAs: (userId) =>
        set((s) => {
          const user = CONCORD_USERS.find((u) => u.id === userId);
          if (user) {
            s.currentUser = { ...user, status: 'online', customStatus: '', aboutMe: '', banner: '', createdAt: Date.now() };
            // Ensure Zyntra workspace always exists
            if (!s.workspaces.find((w) => w.id === ZYNTRA_WORKSPACE_ID)) {
              s.workspaces.unshift(createZyntraWorkspace());
            }
          }
        }),

      logout: () =>
        set((s) => {
          s.currentUser = null;
          s.voiceConnections = [];
          s.typingUsers = {};
        }),

      updateUserStatus: (status) =>
        set((s) => {
          if (s.currentUser) s.currentUser.status = status;
        }),

      updateProfile: (updates) =>
        set((s) => {
          if (!s.currentUser) return;
          if (updates.displayName !== undefined) s.currentUser.displayName = updates.displayName;
          if (updates.avatar !== undefined) s.currentUser.avatar = updates.avatar;
          if (updates.customStatus !== undefined) s.currentUser.customStatus = updates.customStatus;
          if (updates.aboutMe !== undefined) s.currentUser.aboutMe = updates.aboutMe;
          if (updates.banner !== undefined) s.currentUser.banner = updates.banner;
        }),

      getCurrentUser: () => get().currentUser,

      getUserById: (id) => {
        const current = get().currentUser;
        if (current && current.id === id) return current;
        return CONCORD_USERS.find((u) => u.id === id);
      },

      // ── Workspace ──
      createWorkspace: (name, icon) => {
        const id = generateId();
        set((s) => {
          if (!s.currentUser) return;
          s.workspaces.push({
            id,
            name,
            icon,
            description: '',
            banner: '',
            ownerId: s.currentUser.id,
            members: [
              {
                userId: s.currentUser.id,
                role: 'owner',
                joinedAt: Date.now(),
              },
            ],
            channels: [],
            boards: [],
            pages: [],
            createdAt: Date.now(),
          });
        });
        return id;
      },

      deleteWorkspace: (id) =>
        set((s) => {
          if (id === ZYNTRA_WORKSPACE_ID) return; // Zyntra cannot be deleted
          s.workspaces = s.workspaces.filter((w) => w.id !== id);
        }),

      renameWorkspace: (id, name) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === id);
          if (ws) ws.name = name;
        }),

      updateWorkspace: (id, updates) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === id);
          if (!ws) return;
          if (updates.name !== undefined) ws.name = updates.name;
          if (updates.icon !== undefined) ws.icon = updates.icon;
          if (updates.iconImage !== undefined) ws.iconImage = updates.iconImage;
          if (updates.description !== undefined) ws.description = updates.description;
          if (updates.banner !== undefined) ws.banner = updates.banner;
        }),

      getWorkspaceById: (id) => get().workspaces.find((w) => w.id === id),

      // ── Channel ──
      createChannel: (workspaceId, name, type, description) => {
        const id = generateId();
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          if (!ws) return;
          ws.channels.push({
            id,
            workspaceId,
            name: name.toLowerCase().replace(/\s+/g, '-'),
            description: description ?? '',
            type,
            messages: [],
            pinnedMessageIds: [],
            createdAt: Date.now(),
          });
        });
        return id;
      },

      deleteChannel: (workspaceId, channelId) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          if (!ws) return;
          ws.channels = ws.channels.filter((c) => c.id !== channelId);
        }),

      renameChannel: (workspaceId, channelId, name) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          const ch = ws?.channels.find((c) => c.id === channelId);
          if (ch) ch.name = name.toLowerCase().replace(/\s+/g, '-');
        }),

      updateChannelDescription: (workspaceId, channelId, desc) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          const ch = ws?.channels.find((c) => c.id === channelId);
          if (ch) ch.description = desc;
        }),

      getChannelById: (workspaceId, channelId) => {
        const ws = get().workspaces.find((w) => w.id === workspaceId);
        return ws?.channels.find((c) => c.id === channelId);
      },

      getChannelMessages: (workspaceId, channelId) => {
        const ws = get().workspaces.find((w) => w.id === workspaceId);
        const ch = ws?.channels.find((c) => c.id === channelId);
        return ch?.messages ?? [];
      },

      // ── Message ──
      sendMessage: (workspaceId, channelId, content) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          const ch = ws?.channels.find((c) => c.id === channelId);
          if (!ch || !s.currentUser) return;
          ch.messages.push({
            id: generateId(),
            channelId,
            authorId: s.currentUser.id,
            content,
            attachments: [],
            reactions: [],
            isPinned: false,
            isEdited: false,
            createdAt: Date.now(),
          });
        }),

      editMessage: (workspaceId, channelId, messageId, newContent) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          const ch = ws?.channels.find((c) => c.id === channelId);
          const msg = ch?.messages.find((m) => m.id === messageId);
          if (!msg) return;
          msg.content = newContent;
          msg.isEdited = true;
          msg.editedAt = Date.now();
        }),

      deleteMessage: (workspaceId, channelId, messageId) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          const ch = ws?.channels.find((c) => c.id === channelId);
          if (!ch) return;
          ch.messages = ch.messages.filter((m) => m.id !== messageId);
        }),

      toggleReaction: (workspaceId, channelId, messageId, emoji) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          const ch = ws?.channels.find((c) => c.id === channelId);
          const msg = ch?.messages.find((m) => m.id === messageId);
          if (!msg || !s.currentUser) return;
          const userId = s.currentUser.id;

          const existing = msg.reactions.find((r) => r.emoji === emoji);
          if (existing) {
            if (existing.userIds.includes(userId)) {
              existing.userIds = existing.userIds.filter((id) => id !== userId);
              if (existing.userIds.length === 0) {
                msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
              }
            } else {
              existing.userIds.push(userId);
            }
          } else {
            msg.reactions.push({ emoji, userIds: [userId] });
          }
        }),

      togglePinMessage: (workspaceId, channelId, messageId) =>
        set((s) => {
          const ws = s.workspaces.find((w) => w.id === workspaceId);
          const ch = ws?.channels.find((c) => c.id === channelId);
          const msg = ch?.messages.find((m) => m.id === messageId);
          if (!msg || !ch) return;
          msg.isPinned = !msg.isPinned;
          if (msg.isPinned) {
            ch.pinnedMessageIds.push(messageId);
          } else {
            ch.pinnedMessageIds = ch.pinnedMessageIds.filter((id) => id !== messageId);
          }
        }),

      // ── Voice ──
      joinVoiceChannel: (channelId) =>
        set((s) => {
          if (!s.currentUser) return;
          // Leave any existing voice channel
          s.voiceConnections = s.voiceConnections.filter(
            (vc) => vc.userId !== s.currentUser!.id,
          );
          s.voiceConnections.push({
            channelId,
            userId: s.currentUser.id,
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
          });
        }),

      leaveVoiceChannel: () =>
        set((s) => {
          if (!s.currentUser) return;
          s.voiceConnections = s.voiceConnections.filter(
            (vc) => vc.userId !== s.currentUser!.id,
          );
        }),

      toggleMute: () =>
        set((s) => {
          if (!s.currentUser) return;
          const vc = s.voiceConnections.find((v) => v.userId === s.currentUser!.id);
          if (vc) vc.isMuted = !vc.isMuted;
        }),

      toggleDeafen: () =>
        set((s) => {
          if (!s.currentUser) return;
          const vc = s.voiceConnections.find((v) => v.userId === s.currentUser!.id);
          if (vc) {
            vc.isDeafened = !vc.isDeafened;
            if (vc.isDeafened) vc.isMuted = true;
          }
        }),

      getVoiceChannel: () => {
        const user = get().currentUser;
        if (!user) return null;
        const vc = get().voiceConnections.find((v) => v.userId === user.id);
        return vc?.channelId ?? null;
      },

      getVoiceUsers: (channelId) =>
        get().voiceConnections.filter((vc) => vc.channelId === channelId),

      setSpeaking: (userId, speaking) =>
        set((s) => {
          const vc = s.voiceConnections.find((v) => v.userId === userId);
          if (vc) vc.isSpeaking = speaking;
        }),

      // ── Typing ──
      setTyping: (channelId, isTyping) =>
        set((s) => {
          if (!s.currentUser) return;
          const userId = s.currentUser.id;
          if (!s.typingUsers[channelId]) s.typingUsers[channelId] = [];
          if (isTyping) {
            if (!s.typingUsers[channelId].includes(userId)) {
              s.typingUsers[channelId].push(userId);
            }
          } else {
            s.typingUsers[channelId] = s.typingUsers[channelId].filter(
              (id) => id !== userId,
            );
          }
        }),

      reset: () =>
        set(() => ({
          currentUser: null,
          workspaces: [],
          voiceConnections: [],
          typingUsers: {},
        })),
    })),
    {
      name: 'concord-chat',
      partialize: (state) => ({
        currentUser: state.currentUser,
        // workspaces, voice, typing come from the server
      }),
    },
  ),
);

enableSync(useChatStore, 'chat', ['currentUser']);
