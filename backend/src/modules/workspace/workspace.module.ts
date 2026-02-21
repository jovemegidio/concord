import { Module } from '@nestjs/common';
import { BoardController } from './controllers/board.controller';
import { CardController } from './controllers/card.controller';
import { BoardService } from './services/board.service';
import { ColumnService } from './services/column.service';
import { CardService } from './services/card.service';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Module({
  controllers: [BoardController, CardController],
  providers: [BoardService, ColumnService, CardService, TenantGuard],
  exports: [BoardService, CardService],
})
export class WorkspaceModule {}
