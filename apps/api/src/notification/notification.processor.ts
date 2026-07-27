import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationService } from './notification.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notifications: NotificationService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'send') return;
    const data = job.data as {
      channel: string;
      recipient: string;
      subject?: string;
      body: string;
      agencyId?: string;
      userId?: string;
      metadata?: unknown;
    };
    const notification = await this.notifications.enqueue(data);
    const result = await this.notifications.deliver(notification.id);
    this.logger.log(`Notification ${notification.id} => ${result.status}`);
    return result;
  }
}
