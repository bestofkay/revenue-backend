import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AbacService } from '../common/services/abac.service';

@Global()
@Module({
  providers: [AuditService, AbacService],
  controllers: [AuditController],
  exports: [AuditService, AbacService],
})
export class AuditModule {}
