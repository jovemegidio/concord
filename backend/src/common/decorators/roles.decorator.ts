import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict endpoint to specific tenant roles.
 * Usage: @Roles(TenantRole.ADMIN, TenantRole.OWNER)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
