// ============================================================================
// Communication Service - Frontend API layer
// ============================================================================

import httpClient from '../../infrastructure/http/client';
import type { Server, Channel, Message } from '../../types/api.types';

export const communicationService = {
  // ─── Servers ───

  async getServers(tenantId: string): Promise<Server[]> {
    return httpClient.get<Server[]>(`/tenants/${tenantId}/servers`);
  },

  async createServer(tenantId: string, name: string, description?: string): Promise<Server> {
    return httpClient.post<Server>(`/tenants/${tenantId}/servers`, { name, description });
  },

  async getServer(tenantId: string, serverId: string): Promise<Server> {
    return httpClient.get<Server>(`/tenants/${tenantId}/servers/${serverId}`);
  },

  async deleteServer(tenantId: string, serverId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/servers/${serverId}`);
  },

  // ─── Channels ───

  async getChannels(tenantId: string, serverId: string): Promise<Channel[]> {
    return httpClient.get<Channel[]>(`/tenants/${tenantId}/servers/${serverId}/channels`);
  },

  async createChannel(
    tenantId: string,
    serverId: string,
    data: { name: string; type?: string; topic?: string; isPrivate?: boolean },
  ): Promise<Channel> {
    return httpClient.post<Channel>(`/tenants/${tenantId}/servers/${serverId}/channels`, data);
  },

  async deleteChannel(tenantId: string, serverId: string, channelId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/servers/${serverId}/channels/${channelId}`);
  },

  // ─── Messages ───

  async getMessages(tenantId: string, channelId: string, before?: string, limit?: number): Promise<Message[]> {
    let path = `/tenants/${tenantId}/channels/${channelId}/messages`;
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    if (qs) path += `?${qs}`;
    return httpClient.get<Message[]>(path);
  },

  async sendMessage(tenantId: string, channelId: string, content: string, type?: string): Promise<Message> {
    return httpClient.post<Message>(`/tenants/${tenantId}/channels/${channelId}/messages`, {
      content,
      type: type || 'TEXT',
    });
  },

  async editMessage(tenantId: string, channelId: string, messageId: string, content: string): Promise<Message> {
    return httpClient.put<Message>(`/tenants/${tenantId}/channels/${channelId}/messages/${messageId}`, { content });
  },

  async deleteMessage(tenantId: string, channelId: string, messageId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/channels/${channelId}/messages/${messageId}`);
  },

  async toggleReaction(tenantId: string, channelId: string, messageId: string, emoji: string) {
    return httpClient.post(`/tenants/${tenantId}/channels/${channelId}/messages/${messageId}/reactions`, { emoji });
  },

  async searchMessages(tenantId: string, channelId: string, query: string): Promise<Message[]> {
    return httpClient.get<Message[]>(
      `/tenants/${tenantId}/channels/${channelId}/messages/search?q=${encodeURIComponent(query)}`,
    );
  },
};
