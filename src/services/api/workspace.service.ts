// ============================================================================
// Workspace (Kanban) Service - Frontend API layer
// ============================================================================

import httpClient from '../../infrastructure/http/client';
import type { Board, Card, CardComment, Checklist } from '../../types/api.types';

export const workspaceService = {
  // ─── Boards ───

  async getBoards(tenantId: string): Promise<Board[]> {
    return httpClient.get<Board[]>(`/tenants/${tenantId}/boards`);
  },

  async createBoard(tenantId: string, data: { name: string; description?: string; color?: string }): Promise<Board> {
    return httpClient.post<Board>(`/tenants/${tenantId}/boards`, data);
  },

  async getBoard(tenantId: string, boardId: string): Promise<Board> {
    return httpClient.get<Board>(`/tenants/${tenantId}/boards/${boardId}`);
  },

  async updateBoard(tenantId: string, boardId: string, data: Partial<Board>): Promise<Board> {
    return httpClient.put<Board>(`/tenants/${tenantId}/boards/${boardId}`, data);
  },

  async deleteBoard(tenantId: string, boardId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/boards/${boardId}`);
  },

  // ─── Columns ───

  async createColumn(tenantId: string, boardId: string, data: { name: string; color?: string }): Promise<any> {
    return httpClient.post(`/tenants/${tenantId}/boards/${boardId}/columns`, data);
  },

  async updateColumn(tenantId: string, boardId: string, columnId: string, data: any): Promise<any> {
    return httpClient.put(`/tenants/${tenantId}/boards/${boardId}/columns/${columnId}`, data);
  },

  async deleteColumn(tenantId: string, boardId: string, columnId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/boards/${boardId}/columns/${columnId}`);
  },

  async reorderColumns(tenantId: string, boardId: string, columnIds: string[]): Promise<void> {
    return httpClient.put(`/tenants/${tenantId}/boards/${boardId}/columns/reorder`, { columnIds });
  },

  // ─── Cards ───

  async createCard(tenantId: string, columnId: string, data: { title: string; description?: string; priority?: string }): Promise<Card> {
    return httpClient.post<Card>(`/tenants/${tenantId}/columns/${columnId}/cards`, data);
  },

  async getCard(tenantId: string, columnId: string, cardId: string): Promise<Card> {
    return httpClient.get<Card>(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}`);
  },

  async updateCard(tenantId: string, columnId: string, cardId: string, data: Partial<Card>): Promise<Card> {
    return httpClient.put<Card>(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}`, data);
  },

  async moveCard(tenantId: string, columnId: string, cardId: string, targetColumnId: string, position: number): Promise<void> {
    return httpClient.put(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/move`, {
      targetColumnId,
      position,
    });
  },

  async deleteCard(tenantId: string, columnId: string, cardId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}`);
  },

  // ─── Assignments ───

  async assignUser(tenantId: string, columnId: string, cardId: string, userId: string): Promise<void> {
    return httpClient.post(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/assign/${userId}`);
  },

  async unassignUser(tenantId: string, columnId: string, cardId: string, userId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/assign/${userId}`);
  },

  // ─── Checklists ───

  async createChecklist(tenantId: string, columnId: string, cardId: string, title: string): Promise<Checklist> {
    return httpClient.post<Checklist>(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/checklists`, { title });
  },

  async addChecklistItem(tenantId: string, columnId: string, cardId: string, checklistId: string, title: string) {
    return httpClient.post(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items`, { title });
  },

  async toggleChecklistItem(tenantId: string, columnId: string, cardId: string, checklistId: string, itemId: string) {
    return httpClient.put(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}/toggle`);
  },

  // ─── Comments ───

  async addComment(tenantId: string, columnId: string, cardId: string, content: string): Promise<CardComment> {
    return httpClient.post<CardComment>(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/comments`, { content });
  },

  async deleteComment(tenantId: string, columnId: string, cardId: string, commentId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`);
  },
};
