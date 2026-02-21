// ============================================================================
// Frontend Domain Types - Clean Architecture
// These types mirror the backend Prisma models for type safety
// ============================================================================

// ─── Core ───

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  logoUrl?: string;
  settings: Record<string, any>;
  maxUsers: number;
  isActive: boolean;
  role?: string;
  memberCount?: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status: 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';
  lastSeenAt?: string;
}

export interface TenantMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'GUEST';
  nickname?: string;
  user: User;
  joinedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

// ─── Communication ───

export interface Server {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  isDefault: boolean;
  channels: Channel[];
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  topic?: string;
  type: 'TEXT' | 'VOICE' | 'ANNOUNCEMENT' | 'FORUM';
  isPrivate: boolean;
  position: number;
  messageCount?: number;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'EMBED';
  attachments?: any;
  isPinned: boolean;
  editedAt?: string;
  createdAt: string;
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  reactions: Reaction[];
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  user?: Pick<User, 'id' | 'displayName'>;
}

// ─── Workspace (Kanban) ───

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
  isClosed: boolean;
  columns: BoardColumn[];
  labels: Label[];
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  color?: string;
  position: number;
  wipLimit?: number;
  cards: Card[];
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  coverColor?: string;
  isArchived: boolean;
  createdAt: string;
  assignments: Array<{ user: Pick<User, 'id' | 'displayName' | 'avatarUrl'> }>;
  labels: Array<{ label: Label }>;
  checklists: Checklist[];
  commentCount?: number;
  attachmentCount?: number;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

export interface CardComment {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
}

// ─── Knowledge (Pages) ───

export interface Page {
  id: string;
  tenantId: string;
  parentId?: string;
  title: string;
  icon?: string;
  coverUrl?: string;
  isTemplate: boolean;
  isFavorite: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
  children: PageTreeNode[];
  parent?: PageTreeNode;
}

export interface PageTreeNode {
  id: string;
  title: string;
  icon?: string;
  parentId?: string;
  children?: PageTreeNode[];
  childCount?: number;
}

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  content: any;
  properties: any;
  position: number;
  parentBlockId?: string;
  children?: Block[];
}

export type BlockType =
  | 'PARAGRAPH'
  | 'HEADING_1'
  | 'HEADING_2'
  | 'HEADING_3'
  | 'BULLETED_LIST'
  | 'NUMBERED_LIST'
  | 'TODO'
  | 'TOGGLE'
  | 'CODE'
  | 'QUOTE'
  | 'DIVIDER'
  | 'IMAGE'
  | 'TABLE'
  | 'CALLOUT'
  | 'EMBED';

// ─── Audit ───

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  createdAt: string;
}

// ─── API Response ───

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
