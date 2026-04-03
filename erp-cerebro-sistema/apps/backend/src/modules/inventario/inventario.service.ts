import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PRODUCTOS
  // ───────────────────────────────────────────────────────────────────────────

  async getProductos(page: number, limit: number, search?: string, categoria?: string) {
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoria) {
      where.categoria = categoria;
    }

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: {
            include: {
              almacen: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true,
                },
              },
            },
          },
          _count: {
            select: {
              movimientos: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      success: true,
      data: productos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProducto(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        stock: {
          include: {
            almacen: true,
          },
        },
        movimientos: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            almacen: true,
            usuario: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return { success: true, data: producto };
  }

  async createProducto(dto: any) {
    // Verificar código único
    const existing = await this.prisma.producto.findUnique({
      where: { codigo: dto.codigo },
    });

    if (existing) {
      throw new BadRequestException('El código del producto ya existe');
    }

    const producto = await this.prisma.producto.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
      },
    });

    return { success: true, data: producto };
  }

  async updateProducto(id: string, dto: any) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Si actualiza código, verificar que no exista
    if (dto.codigo && dto.codigo !== producto.codigo) {
      const existing = await this.prisma.producto.findUnique({
        where: { codigo: dto.codigo },
      });

      if (existing) {
        throw new BadRequestException('El código del producto ya existe');
      }
    }

    const updated = await this.prisma.producto.update({
      where: { id },
      data: dto,
    });

    return { success: true, data: updated };
  }

  async deleteProducto(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        movimientos: true,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (producto.movimientos.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar un producto con movimientos registrados',
      );
    }

    await this.prisma.producto.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Producto eliminado exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ALMACENES
  // ───────────────────────────────────────────────────────────────────────────

  async getAlmacenes() {
    const almacenes = await this.prisma.almacen.findMany({
      where: { isActive: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: {
            stock: true,
            movimientos: true,
          },
        },
      },
    });

    return { success: true, data: almacenes };
  }

  async createAlmacen(dto: any) {
    const existing = await this.prisma.almacen.findUnique({
      where: { codigo: dto.codigo },
    });

    if (existing) {
      throw new BadRequestException('El código del almacén ya existe');
    }

    const almacen = await this.prisma.almacen.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
      },
    });

    return { success: true, data: almacen };
  }

  async updateAlmacen(id: string, dto: any) {
    const almacen = await this.prisma.almacen.findUnique({
      where: { id },
    });

    if (!almacen) {
      throw new NotFoundException('Almacén no encontrado');
    }

    const updated = await this.prisma.almacen.update({
      where: { id },
      data: dto,
    });

    return { success: true, data: updated };
  }

  async deleteAlmacen(id: string) {
    const almacen = await this.prisma.almacen.findUnique({
      where: { id },
      include: {
        stock: true,
        movimientos: true,
      },
    });

    if (!almacen) {
      throw new NotFoundException('Almacén no encontrado');
    }

    if (almacen.stock.some(s => s.cantidad > 0)) {
      throw new BadRequestException(
        'No se puede eliminar un almacén con stock',
      );
    }

    await this.prisma.almacen.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Almacén eliminado exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STOCK
  // ───────────────────────────────────────────────────────────────────────────

  async getStock(productoId: string, almacenId?: string) {
    const where: any = { productoId };

    if (almacenId) {
      where.almacenId = almacenId;
    }

    const stock = await this.prisma.stock.findMany({
      where,
      include: {
        producto: {
          select: {
            codigo: true,
            nombre: true,
          },
        },
        almacen: {
          select: {
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    return { success: true, data: stock };
  }

  async getStockBajo(almacenId?: string) {
    const where: any = {
      cantidad: {
        lte: this.prisma.stock.fields.min,
      },
    };

    if (almacenId) {
      where.almacenId = almacenId;
    }

    const stockBajo = await this.prisma.stock.findMany({
      where: {
        ...(almacenId ? { almacenId } : {}),
      },
      include: {
        producto: {
          select: {
            codigo: true,
            nombre: true,
            existenciaMinima: true,
          },
        },
        almacen: {
          select: {
            nombre: true,
          },
        },
      },
      where: {
        ...(almacenId ? { almacenId } : {}),
      },
    });

    // Filtrar productos con stock bajo
    const filtrado = stockBajo.filter(s => 
      s.cantidad <= (s.producto.existenciaMinima || 10)
    );

    return { success: true, data: filtrado };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MOVIMIENTOS
  // ───────────────────────────────────────────────────────────────────────────

  async getMovimientos(
    page: number,
    limit: number,
    productoId?: string,
    almacenId?: string,
    tipo?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (productoId) where.productoId = productoId;
    if (almacenId) where.almacenId = almacenId;
    if (tipo) where.tipo = tipo;

    const [movimientos, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        skip,
        take: limit,
        include: {
          producto: {
            select: {
              codigo: true,
              nombre: true,
            },
          },
          almacen: {
            select: {
              nombre: true,
            },
          },
          usuario: {
            select: {
              username: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    return {
      success: true,
      data: movimientos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createMovimiento(dto: any, userId: string) {
    const { productoId, almacenId, tipo, cantidad, referencia, descripcion } = dto;

    // Obtener stock actual
    const stock = await this.prisma.stock.findFirst({
      where: { productoId, almacenId },
    });

    const stockActual = stock?.cantidad || 0;
    let nuevoStock = stockActual;

    if (tipo === 'ENTRADA') {
      nuevoStock += cantidad;
    } else if (tipo === 'SALIDA') {
      if (stockActual < cantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Actual: ${stockActual}, Requerido: ${cantidad}`,
        );
      }
      nuevoStock -= cantidad;
    }

    // Crear movimiento y actualizar stock en transacción
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Crear movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          productoId,
          almacenId,
          tipo,
          cantidad,
          stockAnterior: stockActual,
          stockNuevo: nuevoStock,
          referencia,
          descripcion,
          usuarioId: userId,
        },
      });

      // Actualizar o crear stock
      if (stock) {
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            cantidad: nuevoStock,
            ultimaActualizacion: new Date(),
          },
        });
      } else {
        await tx.stock.create({
          data: {
            productoId,
            almacenId,
            cantidad: nuevoStock,
          },
        });
      }

      // Actualizar producto
      await tx.producto.update({
        where: { id: productoId },
        data: { existenciaActual: nuevoStock },
      });

      return movimiento;
    });

    return { success: true, data: resultado };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSFERENCIAS
  // ───────────────────────────────────────────────────────────────────────────

  async createTransferencia(dto: any, userId: string) {
    const { productoId, origenId, destinoId, cantidad, referencia, descripcion } = dto;

    // Verificar stock en origen
    const stockOrigen = await this.prisma.stock.findFirst({
      where: { productoId, almacenId: origenId },
    });

    if (!stockOrigen || stockOrigen.cantidad < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente en almacén origen. Actual: ${stockOrigen?.cantidad || 0}`,
      );
    }

    // Crear transferencia y movimientos en transacción
    await this.prisma.$transaction(async (tx) => {
      // Crear transferencia
      await tx.transferenciaInventario.create({
        data: {
          productoId,
          origenId,
          destinoId,
          cantidad,
          referencia,
          descripcion,
          usuarioId: userId,
        },
      });

      // Restar del origen
      await tx.stock.update({
        where: { id: stockOrigen.id },
        data: { cantidad: stockOrigen.cantidad - cantidad },
      });

      // Sumar al destino
      const stockDestino = await tx.stock.findFirst({
        where: { productoId, almacenId: destinoId },
      });

      if (stockDestino) {
        await tx.stock.update({
          where: { id: stockDestino.id },
          data: { cantidad: stockDestino.cantidad + cantidad },
        });
      } else {
        await tx.stock.create({
          data: {
            productoId,
            almacenId: destinoId,
            cantidad,
          },
        });
      }

      // Crear movimientos
      await tx.movimientoInventario.create({
        data: {
          productoId,
          almacenId: origenId,
          tipo: 'SALIDA',
          cantidad,
          stockAnterior: stockOrigen.cantidad,
          stockNuevo: stockOrigen.cantidad - cantidad,
          referencia: referencia || `TRANSFERENCIA A ${destinoId}`,
          descripcion: descripcion || 'Transferencia entre almacenes',
          usuarioId: userId,
        },
      });

      const stockDestinoActual = stockDestino?.cantidad || 0;
      await tx.movimientoInventario.create({
        data: {
          productoId,
          almacenId: destinoId,
          tipo: 'ENTRADA',
          cantidad,
          stockAnterior: stockDestinoActual,
          stockNuevo: stockDestinoActual + cantidad,
          referencia: referencia || `TRANSFERENCIA DE ${origenId}`,
          descripcion: descripcion || 'Transferencia entre almacenes',
          usuarioId: userId,
        },
      });
    });

    return { success: true, message: 'Transferencia realizada exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // AJUSTES DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────

  async createAjuste(dto: any, userId: string) {
    const { productoId, almacenId, cantidadFisica, motivo } = dto;

    // Obtener stock actual
    const stock = await this.prisma.stock.findFirst({
      where: { productoId, almacenId },
    });

    if (!stock) {
      throw new NotFoundException('Stock no encontrado para este producto/almacén');
    }

    const diferencia = cantidadFisica - stock.cantidad;
    const tipo = diferencia >= 0 ? 'ENTRADA' : 'SALIDA';

    // Actualizar stock y crear movimiento
    await this.prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: { id: stock.id },
        data: {
          cantidad: cantidadFisica,
          ultimaActualizacion: new Date(),
        },
      });

      await tx.movimientoInventario.create({
        data: {
          productoId,
          almacenId,
          tipo,
          cantidad: Math.abs(diferencia),
          stockAnterior: stock.cantidad,
          stockNuevo: cantidadFisica,
          referencia: 'AJUSTE',
          descripcion: motivo || `Ajuste de inventario. Diferencia: ${diferencia}`,
          usuarioId: userId,
        },
      });

      await tx.producto.update({
        where: { id: productoId },
        data: { existenciaActual: cantidadFisica },
      });
    });

    return {
      success: true,
      data: {
        stockAnterior: stock.cantidad,
        stockNuevo: cantidadFisica,
        diferencia,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VALORIZACIÓN DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────

  async getValorizacion(almacenId?: string) {
    const where: any = {
      cantidad: { gt: 0 },
    };

    if (almacenId) {
      where.almacenId = almacenId;
    }

    const stock = await this.prisma.stock.findMany({
      where,
      include: {
        producto: {
          select: {
            codigo: true,
            nombre: true,
            costoActual: true,
            precioVenta: true,
          },
        },
        almacen: {
          select: {
            nombre: true,
          },
        },
      },
    });

    const valorizacion = stock.map(s => ({
      producto: s.producto,
      almacen: s.almacen,
      cantidad: s.cantidad,
      costoUnitario: s.producto.costoActual,
      valorTotal: s.cantidad * s.producto.costoActual,
      precioVenta: s.producto.precioVenta,
      valorVenta: s.cantidad * s.producto.precioVenta,
      utilidadPotencial: (s.cantidad * s.producto.precioVenta) - (s.cantidad * s.producto.costoActual),
    }));

    const totalValorCosto = valorizacion.reduce((sum, v) => sum + v.valorTotal, 0);
    const totalValorVenta = valorizacion.reduce((sum, v) => sum + v.valorVenta, 0);
    const totalUtilidad = valorizacion.reduce((sum, v) => sum + v.utilidadPotencial, 0);

    return {
      success: true,
      data: {
        items: valorizacion,
        totales: {
          totalProductos: valorizacion.length,
          totalUnidades: valorizacion.reduce((sum, v) => sum + v.cantidad, 0),
          totalValorCosto,
          totalValorVenta,
          totalUtilidadPotencial: totalUtilidad,
          margenPotencial: totalValorVenta > 0 ? ((totalUtilidad / totalValorVenta) * 100) : 0,
        },
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ROTACIÓN DE INVENTARIO
  // ───────────────────────────────────────────────────────────────────────────

  async getRotacion(fechaDesde: string, fechaHasta: string) {
    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        tipo: 'SALIDA',
        createdAt: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta),
        },
      },
      include: {
        producto: {
          select: {
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    // Agrupar por producto
    const rotacionPorProducto = movimientos.reduce((acc, mov) => {
      if (!acc[mov.productoId]) {
        acc[mov.productoId] = {
          producto: mov.producto,
          cantidadVendida: 0,
        };
      }
      acc[mov.productoId].cantidadVendida += mov.cantidad;
      return acc;
    }, {});

    // Obtener stock actual
    const stockActual = await this.prisma.stock.findMany({
      where: {
        productoId: { in: Object.keys(rotacionPorProducto) },
      },
    });

    const resultado = Object.values(rotacionPorProducto).map((item: any) => {
      const stock = stockActual.find(s => s.productoId === item.producto.codigo);
      const stockPromedio = stock?.cantidad || 0;
      const diasPeriodo = Math.ceil(
        (new Date(fechaHasta).getTime() - new Date(fechaDesde).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        producto: item.producto,
        cantidadVendida: item.cantidadVendida,
        stockPromedio,
        rotacion: stockPromedio > 0 ? item.cantidadVendida / stockPromedio : 0,
        diasRotacion: stockPromedio > 0 ? diasPeriodo / (item.cantidadVendida / stockPromedio) : 999,
      };
    });

    return {
      success: true,
      data: {
        periodo: {
          desde: fechaDesde,
          hasta: fechaHasta,
        },
        items: resultado.sort((a, b) => b.rotacion - a.rotacion),
      },
    };
  }
}
