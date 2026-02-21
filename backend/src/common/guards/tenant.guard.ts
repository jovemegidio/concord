import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * Validates that the authenticated user belongs to the requested tenant.
 * Prevents IDOR attacks by ensuring:
 * 1. URL param :tenantId matches the X-Tenant-Id header (if both exist)
 * 2. User has an active membership in the tenant
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headerTenantId = request.tenantId || request.headers['x-tenant-id'];
    const paramTenantId = request.params?.tenantId;
    const userId = request.user?.sub;

    // Use URL param tenantId as the source of truth (it's what controllers operate on)
    const tenantId = paramTenantId || headerTenantId;

    if (!tenantId || !userId) {
      throw new ForbiddenException('Tenant ID and authentication required');
    }

    // IDOR protection: If both header and URL param exist, they MUST match
    if (headerTenantId && paramTenantId && headerTenantId !== paramTenantId) {
      throw new ForbiddenException(
        'Tenant ID mismatch: header and URL parameter must match',
      );
    }

    // Verify user is a member of this tenant
    const membership = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: { tenantId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Attach validated tenant info to request for downstream use
    request.tenantId = tenantId;
    request.tenantRole = membership.role;
    request.tenantUserId = membership.id;

    return true;
  }
}
