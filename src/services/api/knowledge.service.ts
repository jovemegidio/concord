// ============================================================================
// Knowledge (Pages / Docs) Service - Frontend API layer
// ============================================================================

import httpClient from '../../infrastructure/http/client';
import type { Page, Block } from '../../types/api.types';

export const knowledgeService = {
  // ─── Pages ───

  async getPages(tenantId: string): Promise<Page[]> {
    return httpClient.get<Page[]>(`/tenants/${tenantId}/pages`);
  },

  async getPageTree(tenantId: string): Promise<Page[]> {
    return httpClient.get<Page[]>(`/tenants/${tenantId}/pages/tree`);
  },

  async getFavorites(tenantId: string): Promise<Page[]> {
    return httpClient.get<Page[]>(`/tenants/${tenantId}/pages/favorites`);
  },

  async getTemplates(tenantId: string): Promise<Page[]> {
    return httpClient.get<Page[]>(`/tenants/${tenantId}/pages/templates`);
  },

  async createPage(tenantId: string, data: {
    title: string;
    icon?: string;
    coverImage?: string;
    parentId?: string;
    isTemplate?: boolean;
  }): Promise<Page> {
    return httpClient.post<Page>(`/tenants/${tenantId}/pages`, data);
  },

  async getPage(tenantId: string, pageId: string): Promise<Page> {
    return httpClient.get<Page>(`/tenants/${tenantId}/pages/${pageId}`);
  },

  async updatePage(tenantId: string, pageId: string, data: Partial<Page>): Promise<Page> {
    return httpClient.put<Page>(`/tenants/${tenantId}/pages/${pageId}`, data);
  },

  async deletePage(tenantId: string, pageId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/pages/${pageId}`);
  },

  async duplicatePage(tenantId: string, pageId: string): Promise<Page> {
    return httpClient.post<Page>(`/tenants/${tenantId}/pages/${pageId}/duplicate`);
  },

  async createVersion(tenantId: string, pageId: string): Promise<any> {
    return httpClient.post(`/tenants/${tenantId}/pages/${pageId}/versions`);
  },

  async getVersions(tenantId: string, pageId: string): Promise<any[]> {
    return httpClient.get<any[]>(`/tenants/${tenantId}/pages/${pageId}/versions`);
  },

  // ─── Blocks ───

  async getBlocks(tenantId: string, pageId: string): Promise<Block[]> {
    return httpClient.get<Block[]>(`/tenants/${tenantId}/pages/${pageId}/blocks`);
  },

  async createBlock(tenantId: string, pageId: string, data: {
    type: string;
    content?: any;
    position?: number;
    parentBlockId?: string;
  }): Promise<Block> {
    return httpClient.post<Block>(`/tenants/${tenantId}/pages/${pageId}/blocks`, data);
  },

  async updateBlock(tenantId: string, pageId: string, blockId: string, data: Partial<Block>): Promise<Block> {
    return httpClient.put<Block>(`/tenants/${tenantId}/pages/${pageId}/blocks/${blockId}`, data);
  },

  async deleteBlock(tenantId: string, pageId: string, blockId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/pages/${pageId}/blocks/${blockId}`);
  },

  async reorderBlocks(tenantId: string, pageId: string, blockIds: string[]): Promise<void> {
    return httpClient.put(`/tenants/${tenantId}/pages/${pageId}/blocks/reorder`, { blockIds });
  },

  async bulkUpdateBlocks(tenantId: string, pageId: string, blocks: Array<{ id: string; content?: any; position?: number }>): Promise<void> {
    return httpClient.put(`/tenants/${tenantId}/pages/${pageId}/blocks/bulk`, { blocks });
  },
};
