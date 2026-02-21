// ============================================================
// Concord — Domain Models & Type System
// Architecture: Domain-Driven Design with strict typing
// ============================================================

// ── Primitives ──────────────────────────────────────────────
export type ID = string;
export type Timestamp = number;
export type HexColor = `#${string}`;

// ── User ────────────────────────────────────────────────────
export interface User {
  id: ID;
  name: string;
  displayName: string;
  avatar: string;
  status: UserStatus;
  customStatus: string;
  aboutMe: string;
  banner: string;
  email: string;
  createdAt: Timestamp;
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export const STATUS_COLORS: Record<UserStatus, string> = {
  online: '#22c55e',
  idle: '#f59e0b',
  dnd: '#ef4444',
  offline: '#6b7280',
};

// ── Workspace ───────────────────────────────────────────────
export interface Workspace {
  id: ID;
  name: string;
  icon: string;
  iconImage?: string;
  description: string;
  banner: string;
  ownerId: ID;
  members: WorkspaceMember[];
  channels: Channel[];
  categories: ChannelCategory[];
  boards: ID[];
  pages: ID[];
  createdAt: Timestamp;
}

export interface WorkspaceMember {
  userId: ID;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Timestamp;
}

// ── Chat Module (Discord-like) ──────────────────────────────
export interface ChannelCategory {
  id: ID;
  workspaceId: ID;
  name: string;
  type: 'text' | 'voice';
  position: number;
  createdAt: Timestamp;
}

export interface Channel {
  id: ID;
  workspaceId: ID;
  name: string;
  description: string;
  type: ChannelType;
  messages: Message[];
  pinnedMessageIds: ID[];
  categoryId?: ID;
  createdAt: Timestamp;
}

export type ChannelType = 'text' | 'voice' | 'announcement';

export interface Message {
  id: ID;
  channelId: ID;
  authorId: ID;
  content: string;
  attachments: Attachment[];
  reactions: Reaction[];
  isPinned: boolean;
  isEdited: boolean;
  replyToId?: ID;
  createdAt: Timestamp;
  editedAt?: Timestamp;
}

export interface Attachment {
  id: ID;
  name: string;
  url: string;
  type: 'image' | 'file' | 'link';
  size?: number;
}

export interface Reaction {
  emoji: string;
  userIds: ID[];
}

// ── Board Module (Trello-like) ──────────────────────────────
export interface Board {
  id: ID;
  workspaceId: ID;
  title: string;
  columns: Column[];
  labels: Label[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Column {
  id: ID;
  boardId: ID;
  title: string;
  cards: Card[];
  position: number;
}

export interface Card {
  id: ID;
  columnId: ID;
  title: string;
  description: string;
  assignees: ID[];
  labels: Label[];
  dueDate?: Timestamp;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  comments: CardComment[];
  priority: Priority;
  position: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChecklistItem {
  id: ID;
  text: string;
  isCompleted: boolean;
}

export interface CardComment {
  id: ID;
  cardId: ID;
  authorId: ID;
  content: string;
  createdAt: Timestamp;
}

export interface Label {
  id: ID;
  name: string;
  color: string;
}

export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Urgente', color: '#ef4444', icon: '🔴' },
  high: { label: 'Alta', color: '#f97316', icon: '🟠' },
  medium: { label: 'Média', color: '#eab308', icon: '🟡' },
  low: { label: 'Baixa', color: '#22c55e', icon: '🟢' },
  none: { label: 'Nenhuma', color: '#6b7280', icon: '⚪' },
};

// ── Pages Module (Notion-like) ───────────────────────────────
export interface Page {
  id: ID;
  workspaceId: ID;
  parentId?: ID;
  title: string;
  icon: string;
  coverImage?: string;
  blocks: Block[];
  children: ID[];
  isFavorite: boolean;
  lastEditedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todo'
  | 'quote'
  | 'divider'
  | 'code'
  | 'callout'
  | 'image'
  | 'toggle'
  | 'reminder';

export interface Block {
  id: ID;
  pageId: ID;
  type: BlockType;
  content: string;
  properties: BlockProperties;
  position: number;
}

export interface BlockProperties {
  checked?: boolean;
  language?: string;
  color?: string;
  imageUrl?: string;
  calloutIcon?: string;
  isOpen?: boolean;
  level?: number;
  collapsed?: boolean;
  reminderDate?: string; // ISO date string for reminders
  reminderTime?: string; // HH:mm format
  [key: string]: unknown;
}

// ── Navigation ──────────────────────────────────────────────
export type AppView = 'chat' | 'boards' | 'pages';

export interface NavigationState {
  currentView: AppView;
  activeWorkspaceId: ID | null;
  activeChannelId: ID | null;
  activeBoardId: ID | null;
  activePageId: ID | null;
  sidebarCollapsed: boolean;
}
