import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContabilidadService } from './contabilidad.service';
import { CreatePlanCuentaDto, CreateAsientoDto } from './dto/contabilidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/guards/permissions.guard';

@Controller('contabilidad')
@UseGuards(JwtAuthGuard)
export class ContabilidadController {
  constructor(private contabilidadService: ContabilidadService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PLAN DE CUENTAS
  // ───────────────────────────────────────────────────────────────────────────

  @Get('plan-cuentas')
  @RequirePermissions('contabilidad:read')
  async getPlanCuentas() {
    return this.contabilidadService.getPlanCuentas();
  }

  @Post('plan-cuentas')
  @RequirePermissions('contabilidad:create')
  async createPlanCuenta(@Body() dto: CreatePlanCuentaDto) {
    return this.contabilidadService.createPlanCuenta(dto);
  }

  @Put('plan-cuentas/:id')
  @RequirePermissions('contabilidad:update')
  async updatePlanCuenta(@Param('id') id: string, @Body() dto: any) {
    return this.contabilidadService.updatePlanCuenta(id, dto);
  }

  @Delete('plan-cuentas/:id')
  @RequirePermissions('contabilidad:delete')
  async deletePlanCuenta(@Param('id') id: string) {
    return this.contabilidadService.deletePlanCuenta(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ASIENTOS CONTABLES
  // ───────────────────────────────────────────────────────────────────────────

  @Get('asientos')
  @RequirePermissions('contabilidad:read')
  async getAsientos(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.contabilidadService.getAsientos(+page, +limit, fechaDesde, fechaHasta);
  }

  @Get('asientos/:id')
  @RequirePermissions('contabilidad:read')
  async getAsiento(@Param('id') id: string) {
    return this.contabilidadService.getAsiento(id);
  }

  @Post('asientos')
  @RequirePermissions('contabilidad:create')
  async createAsiento(@Body() dto: CreateAsientoDto, @Query('userId') userId: string) {
    return this.contabilidadService.createAsiento(dto, userId);
  }

  @Put('asientos/:id')
  @RequirePermissions('contabilidad:update')
  async updateAsiento(@Param('id') id: string, @Body() dto: any) {
    return this.contabilidadService.updateAsiento(id, dto);
  }

  @Delete('asientos/:id')
  @RequirePermissions('contabilidad:delete')
  async deleteAsiento(@Param('id') id: string) {
    return this.contabilidadService.deleteAsiento(id);
  }

  @Post('asientos/:id/anular')
  @RequirePermissions('contabilidad:delete')
  async anularAsiento(@Param('id') id: string, @Body('motivo') motivo: string) {
    return this.contabilidadService.anularAsiento(id, motivo);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LIBROS CONTABLES
  // ───────────────────────────────────────────────────────────────────────────

  @Get('libros/diario')
  @RequirePermissions('contabilidad:read')
  async getLibroDiario(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.contabilidadService.getLibroDiario(fechaDesde, fechaHasta);
  }

  @Get('libros/mayor')
  @RequirePermissions('contabilidad:read')
  async getLibroMayor(
    @Query('cuentaId') cuentaId: string,
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.contabilidadService.getLibroMayor(cuentaId, fechaDesde, fechaHasta);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BALANCES Y REPORTES
  // ───────────────────────────────────────────────────────────────────────────

  @Get('balances/comprobacion')
  @RequirePermissions('reportes-contables:read')
  async getBalanceComprobacion(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.contabilidadService.getBalanceComprobacion(fechaDesde, fechaHasta);
  }

  @Get('balances/situacion-financiera')
  @RequirePermissions('reportes-contables:read')
  async getSituacionFinanciera(@Query('fecha') fecha: string) {
    return this.contabilidadService.getSituacionFinanciera(fecha);
  }

  @Get('balances/estado-resultados')
  @RequirePermissions('reportes-contables:read')
  async getEstadoResultados(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.contabilidadService.getEstadoResultados(fechaDesde, fechaHasta);
  }
}
