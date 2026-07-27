import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = {
  id: string;
  email: string;
  agencyId?: string | null;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
};

export const CurrentUser = createParamDecorator((data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
  const user = request.user;
  return data ? user?.[data] : user;
});
