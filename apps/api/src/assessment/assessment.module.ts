import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { SequenceService } from '../common/services/sequence.service';

@Module({
  controllers: [AssessmentController],
  providers: [AssessmentService, SequenceService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
