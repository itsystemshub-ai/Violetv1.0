import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.usersService.findAll(+page, +limit);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users:create')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @RequirePermissions('users:update')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
