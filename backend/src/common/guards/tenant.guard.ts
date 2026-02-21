import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * Validates that the authenticated user belongs to the requested tenant.
 * Prevents IDOR attacks by ensuring users can only access their own tenants.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.headers['x-tenant-id'];
    const userId = request.user?.sub;

    if (!tenantId || !userId) {
      throw new ForbiddenException('Tenant ID and authentication required');
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

    // Attach role to request for downstream use
    request.tenantRole = membership.role;
    request.tenantUserId = membership.id;

    return true;
  }
}
