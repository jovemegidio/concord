import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * Audit interceptor that logs mutating operations per tenant.
 * Applied to controllers that need audit trail.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit mutating operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const tenantId = request.tenantId;
    const userId = request.user?.sub;
    const handler = context.getHandler().name;
    const controller = context.getClass().name;

    return next.handle().pipe(
      tap({
        next: () => {
          if (tenantId && userId) {
            // Fire-and-forget audit log
            this.prisma.auditLog
              .create({
                data: {
                  tenantId,
                  userId,
                  action: this.mapMethodToAction(method),
                  entity: controller.replace('Controller', ''),
                  entityId: request.params?.id,
                  newData: method !== 'DELETE' ? request.body : undefined,
                  ipAddress: request.ip,
                  userAgent: request.get('user-agent')?.substring(0, 255),
                },
              })
              .catch((err) => console.warn('Audit log failed:', err.message));
          }
        },
      }),
    );
  }

  private mapMethodToAction(method: string): 'CREATE' | 'UPDATE' | 'DELETE' {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PUT':
      case 'PATCH': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return 'UPDATE';
    }
  }
}
