import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateProductoDto, CreateAlmacenDto, CreateMovimientoDto } from './dto/inventario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/guards/permissions.guard';

@Controller('inventario')
@UseGuards(JwtAuthGuard)
export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PRODUCTOS
  // ───────────────────────────────────────────────────────────────────────────

  @Get('productos')
  @RequirePermissions('inventario:read')
  async getProductos(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.inventarioService.getProductos(+page, +limit, search, categoria);
  }

  @Get('productos/:id')
  @RequirePermissions('inventario:read')
  async getProducto(@Param('id') id: string) {
    return this.inventarioService.getProducto(id);
  }

  @Post('productos')
  @RequirePermissions('inventario:create')
  async createProducto(@Body() dto: CreateProductoDto) {
    return this.inventarioService.createProducto(dto);
  }

  @Put('productos/:id')
  @RequirePermissions('inventario:update')
  async updateProducto(@Param('id') id: string, @Body() dto: any) {
    return this.inventarioService.updateProducto(id, dto);
  }

  @Delete('productos/:id')
  @RequirePermissions('inventario:delete')
  async deleteProducto(@Param('id') id: string) {
    return this.inventarioService.deleteProducto(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ALMACENES
  // ───────────────────────────────────────────────────────────────────────────

  @Get('almacenes')
  @RequirePermissions('inventario:read')
  async getAlmacenes() {
    return this.inventarioService.getAlmacenes();
  }

  @Post('almacenes')
  @RequirePermissions('inventario:create')
  async createAlmacen(@Body() dto: CreateAlmacenDto) {
    return this.inventarioService.createAlmacen(dto);
  }

  @Put('almacenes/:id')
  @RequirePermissions('inventario:update')
  async updateAlmacen(@Param('id') id: string, @Body() dto: any) {
    return this.inventarioService.updateAlmacen(id, dto);
  }

  @Delete('almacenes/:id')
  @RequirePermissions('inventario:delete')
  async deleteAlmacen(@Param('id') id: string) {
    return this.inventarioService.deleteAlmacen(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STOCK
  // ───────────────────────────────────────────────────────────────────────────

  @Get('stock/:productoId')
  @RequirePermissions('inventario:read')
  async getStock(@Param('productoId') productoId: string, @Query('almacenId') almacenId?: string) {
    return this.inventarioService.getStock(productoId, almacenId);
  }

  @Get('stock-bajo')
  @RequirePermissions('inventario:read')
  async getStockBajo(@Query('almacenId') almacenId?: string) {
    return this.inventarioService.getStockBajo(almacenId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MOVIMIENTOS
  // ───────────────────────────────────────────────────────────────────────────

  @Get('movimientos')
  @RequirePermissions('inventario:read')
  async getMovimientos(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('productoId') productoId?: string,
    @Query('almacenId') almacenId?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.inventarioService.getMovimientos(+page, +limit, productoId, almacenId, tipo);
  }

  @Post('movimientos')
  @RequirePermissions('inventario:create')
  async createMovimiento(@Body() dto: CreateMovimientoDto, @Query('userId') userId: string) {
    return this.inventarioService.createMovimiento(dto, userId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSFERENCIAS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('transferencias')
  @RequirePermissions('inventario:create')
  async createTransferencia(@Body() dto: any, @Query('userId') userId: string) {
    return this.inventarioService.createTransferencia(dto, userId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // AJUSTES DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────

  @Post('ajustes')
  @RequirePermissions('inventario:create')
  async createAjuste(@Body() dto: any, @Query('userId') userId: string) {
    return this.inventarioService.createAjuste(dto, userId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VALORIZACIÓN DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────

  @Get('valorizacion')
  @RequirePermissions('inventario:read')
  async getValorizacion(@Query('almacenId') almacenId?: string) {
    return this.inventarioService.getValorizacion(almacenId);
  }

  @Get('rotacion')
  @RequirePermissions('inventario:read')
  async getRotacion(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.inventarioService.getRotacion(fechaDesde, fechaHasta);
  }
}
