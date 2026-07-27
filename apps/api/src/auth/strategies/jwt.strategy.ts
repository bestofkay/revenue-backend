import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

type JwtPayload = {
  sub: string;
  email?: string;
  agencyId?: string | null;
  isSuperAdmin?: boolean;
  roles?: string[];
  permissions?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email ?? '',
      agencyId: payload.agencyId,
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  }
}
