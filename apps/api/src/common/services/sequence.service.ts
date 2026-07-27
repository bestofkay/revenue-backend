import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(agencyId: string, name: string, year?: number, month = 0): Promise<number> {
    const y = year ?? new Date().getUTCFullYear();
    const counter = await this.prisma.sequenceCounter.upsert({
      where: {
        agencyId_name_year_month: { agencyId, name, year: y, month },
      },
      create: { agencyId, name, year: y, month, value: 1 },
      update: { value: { increment: 1 } },
    });
    return counter.value;
  }
}
