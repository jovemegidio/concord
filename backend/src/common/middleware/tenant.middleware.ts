import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * Multi-tenant middleware.
 * Extracts X-Tenant-Id header and validates the tenant exists.
 * Attaches tenantId to the request object for downstream use.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      // Allow unauthenticated routes to pass through
      return next();
    }

    // Validate tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true, plan: true },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant ID');
    }

    if (!tenant.isActive) {
      throw new BadRequestException('Organization is deactivated');
    }

    // Attach tenant info to request
    (req as any).tenantId = tenant.id;
    (req as any).tenantPlan = tenant.plan;

    next();
  }
}
