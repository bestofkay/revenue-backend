import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, CreateBranchDto, UpdateAgencyDto } from './dto/agencies.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('agencies')
@ApiBearerAuth()
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesService) {}

  @Post()
  @RequirePermissions('agencies:write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAgencyDto) {
    return this.agencies.create(user, dto);
  }

  @Get()
  @RequirePermissions('agencies:read')
  list(@CurrentUser() user: AuthUser) {
    return this.agencies.findAll(user);
  }

  @Get(':id')
  @RequirePermissions('agencies:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.agencies.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('agencies:write')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAgencyDto) {
    return this.agencies.update(user, id, dto);
  }

  @Post(':id/branches')
  @RequirePermissions('agencies:write')
  addBranch(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateBranchDto) {
    return this.agencies.addBranch(user, id, dto);
  }
}
