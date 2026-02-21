import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract current authenticated user from request.
 * Usage: @CurrentUser() user: UserPayload
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

export interface UserPayload {
  sub: string;       // userId
  email: string;
  displayName: string;
  tenantId?: string;
  role?: string;
}
