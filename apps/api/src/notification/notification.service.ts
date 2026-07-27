import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationChannel, NotificationStatus } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'localhost'),
      port: this.config.get<number>('SMTP_PORT', 1025),
      secure: false,
      auth:
        this.config.get('SMTP_USER')
          ? {
              user: this.config.get('SMTP_USER'),
              pass: this.config.get('SMTP_PASS'),
            }
          : undefined,
    });
  }

  async enqueue(input: {
    channel: NotificationChannel | string;
    recipient: string;
    subject?: string;
    body: string;
    agencyId?: string;
    userId?: string;
    metadata?: unknown;
  }) {
    return this.prisma.notification.create({
      data: {
        channel: input.channel as NotificationChannel,
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        agencyId: input.agencyId,
        userId: input.userId,
        status: NotificationStatus.QUEUED,
        metadata: input.metadata as object | undefined,
      },
    });
  }

  async deliver(notificationId: string) {
    const notification = await this.prisma.notification.findUniqueOrThrow({
      where: { id: notificationId },
    });

    try {
      let providerRef: string | undefined;
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          providerRef = await this.sendEmail(notification.recipient, notification.subject, notification.body);
          break;
        case NotificationChannel.SMS:
          providerRef = await this.sendSms(notification.recipient, notification.body);
          break;
        case NotificationChannel.WHATSAPP:
          providerRef = await this.sendWhatsApp(notification.recipient, notification.body);
          break;
        case NotificationChannel.TELEGRAM:
          providerRef = await this.sendTelegram(notification.recipient, notification.body);
          break;
        case NotificationChannel.PUSH:
          providerRef = `push-${Date.now()}`;
          this.logger.log(`Push notification to ${notification.recipient}: ${notification.body}`);
          break;
        default:
          throw new Error(`Unsupported channel ${notification.channel}`);
      }

      await this.prisma.notificationDelivery.create({
        data: {
          notificationId,
          status: NotificationStatus.SENT,
          providerRef,
        },
      });
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT },
      });
    } catch (error) {
      await this.prisma.notificationDelivery.create({
        data: {
          notificationId,
          status: NotificationStatus.FAILED,
          errorMessage: (error as Error).message,
        },
      });
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED },
      });
    }
  }

  private async sendEmail(to: string, subject: string | null, body: string) {
    const info = await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@revenue.gov.ng'),
      to,
      subject: subject ?? 'Government Revenue Notification',
      text: body,
      html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    });
    return info.messageId;
  }

  private async sendSms(to: string, body: string) {
    const provider = this.config.get('SMS_PROVIDER', 'console');
    if (provider === 'twilio') {
      const sid = this.config.get('TWILIO_ACCOUNT_SID');
      const token = this.config.get('TWILIO_AUTH_TOKEN');
      const from = this.config.get('TWILIO_FROM');
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from ?? '', Body: body }),
      });
      const json = (await res.json()) as { sid?: string; message?: string };
      if (!res.ok) throw new Error(json.message || 'Twilio SMS failed');
      return json.sid;
    }
    this.logger.log(`[SMS] to=${to} body=${body}`);
    return `console-sms-${Date.now()}`;
  }

  private async sendWhatsApp(to: string, body: string) {
    this.logger.log(`[WhatsApp] to=${to} body=${body}`);
    return `console-wa-${Date.now()}`;
  }

  private async sendTelegram(to: string, body: string) {
    const token = this.config.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.log(`[Telegram] to=${to} body=${body}`);
      return `console-tg-${Date.now()}`;
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: to, text: body }),
    });
    const json = (await res.json()) as { ok: boolean; result?: { message_id: number }; description?: string };
    if (!json.ok) throw new Error(json.description || 'Telegram send failed');
    return String(json.result?.message_id);
  }

  async list(agencyId?: string) {
    return this.prisma.notification.findMany({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { deliveries: true },
    });
  }
}
