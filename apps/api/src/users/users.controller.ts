import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateApiKeyDto, CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @RequirePermissions('users:write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.users.create(user, dto);
  }

  @Get()
  @RequirePermissions('users:read')
  list(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.users.findAll(user, agencyId);
  }

  @Patch(':id')
  @RequirePermissions('users:write')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(user, id, dto);
  }

  @Get('roles/list')
  @RequirePermissions('roles:read')
  roles(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.users.listRoles(user, agencyId);
  }

  @Post('api-keys')
  @RequirePermissions('api_keys:write')
  createApiKey(@CurrentUser() user: AuthUser, @Body() dto: CreateApiKeyDto) {
    return this.users.createApiKey(user, dto);
  }
}
