import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { CreateEmpresaConfigDto, UpdateEmpresaConfigDto } from './dto/empresa.dto';
import { CreateSystemConfigDto, UpdateSystemConfigDto } from './dto/system.dto';
import { CreateTablasDto, UpdateTablasDto } from './dto/tablas.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/guards/permissions.guard';

@Controller('configuracion')
@UseGuards(JwtAuthGuard)
export class ConfiguracionController {
  constructor(private configuracionService: ConfiguracionService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // EMPRESA
  // ───────────────────────────────────────────────────────────────────────────

  @Get('empresa')
  @RequirePermissions('configuracion-empresa:read')
  async getEmpresaConfig() {
    return this.configuracionService.getEmpresaConfig();
  }

  @Put('empresa')
  @RequirePermissions('configuracion-empresa:update')
  async updateEmpresaConfig(@Body() dto: UpdateEmpresaConfigDto) {
    return this.configuracionService.updateEmpresaConfig(dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SISTEMA
  // ───────────────────────────────────────────────────────────────────────────

  @Get('sistema')
  @RequirePermissions('configuracion-sistema:read')
  async getSistemaConfig(@Query('group') group?: string) {
    return this.configuracionService.getSistemaConfig(group);
  }

  @Put('sistema/:key')
  @RequirePermissions('configuracion-sistema:update')
  async updateSistemaConfig(
    @Param('key') key: string,
    @Body() dto: UpdateSystemConfigDto,
  ) {
    return this.configuracionService.updateSistemaConfig(key, dto);
  }

  @Get('sistema/group/:group')
  @RequirePermissions('configuracion-sistema:read')
  async getConfigByGroup(@Param('group') group: string) {
    return this.configuracionService.getConfigByGroup(group);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TABLAS DEL SISTEMA
  // ───────────────────────────────────────────────────────────────────────────

  @Get('tablas')
  @RequirePermissions('configuracion-tablas:read')
  async getTablas() {
    return this.configuracionService.getTablas();
  }

  @Get('tablas/:name/items')
  @RequirePermissions('configuracion-tablas:read')
  async getTablaItems(@Param('name') name: string) {
    return this.configuracionService.getTablaItems(name);
  }

  @Post('tablas')
  @RequirePermissions('configuracion-tablas:create')
  async createTabla(@Body() dto: CreateTablasDto) {
    return this.configuracionService.createTabla(dto);
  }

  @Put('tablas/:id')
  @RequirePermissions('configuracion-tablas:update')
  async updateTabla(@Param('id') id: string, @Body() dto: UpdateTablasDto) {
    return this.configuracionService.updateTabla(id, dto);
  }

  @Delete('tablas/:id')
  @RequirePermissions('configuracion-tablas:delete')
  async deleteTabla(@Param('id') id: string) {
    return this.configuracionService.deleteTabla(id);
  }

  @Post('tablas/:tablaId/items')
  @RequirePermissions('configuracion-tablas:create')
  async createTablaItem(
    @Param('tablaId') tablaId: string,
    @Body() dto: any,
  ) {
    return this.configuracionService.createTablaItem(tablaId, dto);
  }

  @Put('tablas-items/:itemId')
  @RequirePermissions('configuracion-tablas:update')
  async updateTablaItem(
    @Param('itemId') itemId: string,
    @Body() dto: any,
  ) {
    return this.configuracionService.updateTablaItem(itemId, dto);
  }

  @Delete('tablas-items/:itemId')
  @RequirePermissions('configuracion-tablas:delete')
  async deleteTablaItem(@Param('itemId') itemId: string) {
    return this.configuracionService.deleteTablaItem(itemId);
  }
}
