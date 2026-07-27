import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/services/crypto.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {
    super();
  }

  async validate(req: Request): Promise<AuthUser> {
    const key = req.header('x-api-key');
    if (!key) throw new UnauthorizedException('API key required');
    const [prefix, secret] = key.split('.');
    if (!prefix || !secret) throw new UnauthorizedException('Invalid API key format');
    const record = await this.prisma.apiKey.findFirst({
      where: {
        keyPrefix: prefix,
        keyHash: this.crypto.hash(secret),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (!record) throw new UnauthorizedException('Invalid API key');
    await this.prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });
    return {
      id: record.userId ?? `api:${record.id}`,
      email: '',
      agencyId: record.agencyId,
      isSuperAdmin: false,
      roles: ['API_CLIENT'],
      permissions: (record.scopes as string[]) ?? [],
    };
  }
}
