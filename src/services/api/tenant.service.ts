// ============================================================================
// Tenant Service - Frontend API layer
// ============================================================================

import httpClient from '../../infrastructure/http/client';
import type { Tenant, TenantMember } from '../../types/api.types';

export const tenantService = {
  async create(name: string, slug: string): Promise<Tenant> {
    return httpClient.post<Tenant>('/tenants', { name, slug });
  },

  async getMyTenants(): Promise<Tenant[]> {
    return httpClient.get<Tenant[]>('/tenants/me');
  },

  async getById(tenantId: string): Promise<Tenant> {
    return httpClient.get<Tenant>(`/tenants/${tenantId}`);
  },

  async update(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    return httpClient.put<Tenant>(`/tenants/${tenantId}`, data);
  },

  async getMembers(tenantId: string): Promise<TenantMember[]> {
    return httpClient.get<TenantMember[]>(`/tenants/${tenantId}/members`);
  },

  async inviteMember(tenantId: string, email: string, role?: string): Promise<TenantMember> {
    return httpClient.post<TenantMember>(`/tenants/${tenantId}/members/invite`, { email, role });
  },

  async removeMember(tenantId: string, userId: string): Promise<void> {
    return httpClient.delete(`/tenants/${tenantId}/members/${userId}`);
  },

  async updateMemberRole(tenantId: string, userId: string, role: string): Promise<void> {
    return httpClient.put(`/tenants/${tenantId}/members/${userId}/role`, { role });
  },

  switchTenant(tenantId: string) {
    httpClient.setTenant(tenantId);
  },
};
