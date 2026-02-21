import { Global, Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, TenantGuard],
  exports: [AuditService],
})
export class AuditModule {}
