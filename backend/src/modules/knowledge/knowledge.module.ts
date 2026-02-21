import { Module } from '@nestjs/common';
import { PageController } from './controllers/page.controller';
import { BlockController } from './controllers/block.controller';
import { PageService } from './services/page.service';
import { BlockService } from './services/block.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Module({
  controllers: [PageController, BlockController],
  providers: [PageService, BlockService, TenantGuard],
  exports: [PageService, BlockService],
})
export class KnowledgeModule {}
