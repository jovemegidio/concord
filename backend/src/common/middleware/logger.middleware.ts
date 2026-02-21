import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Structured logger middleware.
 * Logs all API requests with tenant context for audit trail.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] || '-';
    const userAgent = req.get('user-agent') || '-';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      const logEntry = {
        timestamp: new Date().toISOString(),
        method,
        url: originalUrl,
        status: statusCode,
        duration: `${duration}ms`,
        tenant: tenantId,
        ip,
        userAgent: userAgent.substring(0, 100),
      };

      if (statusCode >= 500) {
        console.error('[HTTP]', JSON.stringify(logEntry));
      } else if (statusCode >= 400) {
        console.warn('[HTTP]', JSON.stringify(logEntry));
      } else {
        console.log('[HTTP]', JSON.stringify(logEntry));
      }
    });

    next();
  }
}
