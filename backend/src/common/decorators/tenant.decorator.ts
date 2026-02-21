import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract tenant ID from request header (X-Tenant-Id).
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || request.headers['x-tenant-id'];
  },
);
