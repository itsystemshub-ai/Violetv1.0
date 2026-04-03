import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RequirePermissions } from '../../common/guards/permissions.guard';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles:read')
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('roles:create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  @RequirePermissions('roles:update')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('roles:delete')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
