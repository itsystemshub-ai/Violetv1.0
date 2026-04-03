import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContabilidadService {
  constructor(private prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PLAN DE CUENTAS
  // ───────────────────────────────────────────────────────────────────────────

  async getPlanCuentas() {
    const cuentas = await this.prisma.planCuenta.findMany({
      where: { isActive: true },
      orderBy: { codigo: 'asc' },
      include: {
        padre: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            hijos: true,
            movimientos: true,
          },
        },
      },
    });

    return { success: true, data: cuentas };
  }

  async createPlanCuenta(dto: any) {
    // Verificar que el código no exista
    const existing = await this.prisma.planCuenta.findUnique({
      where: { codigo: dto.codigo },
    });

    if (existing) {
      throw new BadRequestException('El código de cuenta ya existe');
    }

    const cuenta = await this.prisma.planCuenta.create({
      data: {
        ...dto,
        tipo: dto.tipo || 'MOVIMIENTO',
        naturaleza: dto.naturatura || 'DEUDORA',
        isActive: dto.isActive ?? true,
      },
      include: {
        padre: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    return { success: true, data: cuenta };
  }

  async updatePlanCuenta(id: string, dto: any) {
    const cuenta = await this.prisma.planCuenta.findUnique({
      where: { id },
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    // No permitir modificar si tiene movimientos
    if (cuenta.tipo === 'MOVIMIENTO') {
      const movimientos = await this.prisma.movimientoContable.count({
        where: { cuentaId: id },
      });

      if (movimientos > 0) {
        throw new BadRequestException(
          'No se puede modificar una cuenta con movimientos registrados',
        );
      }
    }

    const updated = await this.prisma.planCuenta.update({
      where: { id },
      data: dto,
    });

    return { success: true, data: updated };
  }

  async deletePlanCuenta(id: string) {
    const cuenta = await this.prisma.planCuenta.findUnique({
      where: { id },
      include: {
        hijos: true,
        movimientos: true,
      },
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    if (cuenta.hijos.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar una cuenta con cuentas hijas',
      );
    }

    if (cuenta.movimientos.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar una cuenta con movimientos registrados',
      );
    }

    await this.prisma.planCuenta.delete({
      where: { id },
    });

    return { success: true, message: 'Cuenta eliminada exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ASIENTOS CONTABLES
  // ───────────────────────────────────────────────────────────────────────────

  async getAsientos(page: number, limit: number, fechaDesde?: string, fechaHasta?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      anulado: false,
    };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    const [asientos, total] = await Promise.all([
      this.prisma.asientoContable.findMany({
        where,
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          movimientos: {
            include: {
              cuenta: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asientoContable.count({ where }),
    ]);

    return {
      success: true,
      data: asientos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAsiento(id: string) {
    const asiento = await this.prisma.asientoContable.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        movimientos: {
          include: {
            cuenta: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!asiento) {
      throw new NotFoundException('Asiento no encontrado');
    }

    return { success: true, data: asiento };
  }

  async createAsiento(dto: any, userId: string) {
    // Validar que el asiento cuadre
    const totalDebe = dto.movimientos
      .filter((m: any) => m.tipo === 'DEBE')
      .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);

    const totalHaber = dto.movimientos
      .filter((m: any) => m.tipo === 'HABER')
      .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new BadRequestException(
        `El asiento no cuadra. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
      );
    }

    // Obtener siguiente correlativo
    const lastAsiento = await this.prisma.asientoContable.findFirst({
      orderBy: { correlativo: 'desc' },
    });

    const nextCorrelativo = (lastAsiento?.correlativo || 0) + 1;

    // Crear asiento con transacción
    const asiento = await this.prisma.$transaction(async (tx) => {
      // Crear asiento
      const created = await tx.asientoContable.create({
        data: {
          correlativo: nextCorrelativo,
          fecha: new Date(dto.fecha),
          descripcion: dto.descripcion,
          tipo: dto.tipo || 'MANUAL',
          referencia: dto.referencia,
          usuarioId: userId,
          totalDebe: totalDebe,
          totalHaber: totalHaber,
        },
      });

      // Crear movimientos
      for (const movimiento of dto.movimientos) {
        await tx.movimientoContable.create({
          data: {
            asientoId: created.id,
            cuentaId: movimiento.cuentaId,
            tipo: movimiento.tipo,
            monto: parseFloat(movimiento.monto),
            descripcion: movimiento.descripcion,
          },
        });
      }

      return tx.asientoContable.findUnique({
        where: { id: created.id },
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          movimientos: {
            include: {
              cuenta: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });
    });

    return { success: true, data: asiento };
  }

  async updateAsiento(id: string, dto: any) {
    const asiento = await this.prisma.asientoContable.findUnique({
      where: { id },
    });

    if (!asiento) {
      throw new NotFoundException('Asiento no encontrado');
    }

    if (asiento.anulado) {
      throw new BadRequestException('No se puede modificar un asiento anulado');
    }

    // Solo permitir actualizar descripción y referencia
    const updated = await this.prisma.asientoContable.update({
      where: { id },
      data: {
        descripcion: dto.descripcion,
        referencia: dto.referencia,
      },
    });

    return { success: true, data: updated };
  }

  async deleteAsiento(id: string) {
    const asiento = await this.prisma.asientoContable.findUnique({
      where: { id },
    });

    if (!asiento) {
      throw new NotFoundException('Asiento no encontrado');
    }

    if (asiento.anulado) {
      throw new BadRequestException('El asiento ya está anulado');
    }

    // Marcar como anulado en lugar de eliminar
    await this.prisma.asientoContable.update({
      where: { id },
      data: {
        anulado: true,
        anuladoEn: new Date(),
      },
    });

    return { success: true, message: 'Asiento anulado exitosamente' };
  }

  async anularAsiento(id: string, motivo: string) {
    const asiento = await this.prisma.asientoContable.findUnique({
      where: { id },
    });

    if (!asiento) {
      throw new NotFoundException('Asiento no encontrado');
    }

    if (asiento.anulado) {
      throw new BadRequestException('El asiento ya está anulado');
    }

    await this.prisma.asientoContable.update({
      where: { id },
      data: {
        anulado: true,
        anuladoEn: new Date(),
        motivoAnulacion: motivo,
      },
    });

    return { success: true, message: 'Asiento anulado exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LIBROS CONTABLES
  // ───────────────────────────────────────────────────────────────────────────

  async getLibroDiario(fechaDesde: string, fechaHasta: string) {
    const asientos = await this.prisma.asientoContable.findMany({
      where: {
        anulado: false,
        fecha: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta),
        },
      },
      include: {
        movimientos: {
          include: {
            cuenta: {
              select: {
                codigo: true,
                nombre: true,
              },
            },
          },
          orderBy: {
            cuenta: {
              codigo: 'asc',
            },
          },
        },
        usuario: {
          select: {
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        fecha: 'asc',
        correlativo: 'asc',
      },
    });

    return { success: true, data: asientos };
  }

  async getLibroMayor(cuentaId: string, fechaDesde: string, fechaHasta: string) {
    const movimientos = await this.prisma.movimientoContable.findMany({
      where: {
        cuentaId,
        asiento: {
          anulado: false,
          fecha: {
            gte: new Date(fechaDesde),
            lte: new Date(fechaHasta),
          },
        },
      },
      include: {
        asiento: {
          select: {
            correlativo: true,
            fecha: true,
            descripcion: true,
            referencia: true,
          },
        },
        cuenta: {
          select: {
            codigo: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        asiento: {
          fecha: 'asc',
        },
      },
    });

    // Calcular saldos acumulados
    let saldoDeudor = 0;
    let saldoAcreedor = 0;

    const movimientosConSaldo = movimientos.map((mov) => {
      if (mov.tipo === 'DEBE') {
        saldoDeudor += mov.monto;
      } else {
        saldoAcreedor += mov.monto;
      }

      return {
        ...mov,
        saldoDeudorAcumulado: saldoDeudor,
        saldoAcreedorAcumulado: saldoAcreedor,
        saldoFinal: saldoDeudor - saldoAcreedor,
      };
    });

    return { success: true, data: movimientosConSaldo };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BALANCES Y REPORTES
  // ───────────────────────────────────────────────────────────────────────────

  async getBalanceComprobacion(fechaDesde: string, fechaHasta: string) {
    // Obtener todas las cuentas con movimientos
    const cuentas = await this.prisma.planCuenta.findMany({
      where: { isActive: true },
      orderBy: { codigo: 'asc' },
      include: {
        movimientos: {
          where: {
            asiento: {
              anulado: false,
              fecha: {
                gte: new Date(fechaDesde),
                lte: new Date(fechaHasta),
              },
            },
          },
        },
      },
    });

    // Calcular saldos por cuenta
    const balance = cuentas.map((cuenta) => {
      const totalDebe = cuenta.movimientos
        .filter((m) => m.tipo === 'DEBE')
        .reduce((sum, m) => sum + m.monto, 0);

      const totalHaber = cuenta.movimientos
        .filter((m) => m.tipo === 'HABER')
        .reduce((sum, m) => sum + m.monto, 0);

      const saldo = totalDebe - totalHaber;

      return {
        cuenta: {
          id: cuenta.id,
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          tipo: cuenta.tipo,
          naturaleza: cuenta.naturaleza,
        },
        debe: totalDebe,
        haber: totalHaber,
        saldo,
        saldoDeudor: saldo > 0 ? saldo : 0,
        saldoAcreedor: saldo < 0 ? Math.abs(saldo) : 0,
      };
    });

    // Totales generales
    const totalDebe = balance.reduce((sum, c) => sum + c.debe, 0);
    const totalHaber = balance.reduce((sum, c) => sum + c.haber, 0);
    const totalCuadre = Math.abs(totalDebe - totalHaber);

    return {
      success: true,
      data: {
        cuentas: balance.filter((c) => c.debe > 0 || c.haber > 0),
        totales: {
          debe: totalDebe,
          haber: totalHaber,
          cuadre: totalCuadre,
          cuadrado: totalCuadre < 0.01,
        },
        periodo: {
          desde: fechaDesde,
          hasta: fechaHasta,
        },
      },
    };
  }

  async getSituacionFinanciera(fecha: string) {
    // Obtener cuentas de balance (Activo, Pasivo, Patrimonio)
    const cuentasBalance = await this.prisma.planCuenta.findMany({
      where: {
        isActive: true,
        tipo: 'SINTETICA',
        OR: [
          { codigo: { startsWith: '1' } }, // Activo
          { codigo: { startsWith: '2' } }, // Pasivo
          { codigo: { startsWith: '3' } }, // Patrimonio
        ],
      },
      orderBy: { codigo: 'asc' },
      include: {
        movimientos: {
          where: {
            asiento: {
              anulado: false,
              fecha: {
                lte: new Date(fecha),
              },
            },
          },
        },
      },
    });

    // Calcular saldos
    const activo = [];
    const pasivo = [];
    const patrimonio = [];

    for (const cuenta of cuentasBalance) {
      const totalDebe = cuenta.movimientos
        .filter((m) => m.tipo === 'DEBE')
        .reduce((sum, m) => sum + m.monto, 0);

      const totalHaber = cuenta.movimientos
        .filter((m) => m.tipo === 'HABER')
        .reduce((sum, m) => sum + m.monto, 0);

      const saldo = totalDebe - totalHaber;

      const grupo = {
        cuenta: {
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
        },
        saldo: Math.abs(saldo),
      };

      if (cuenta.codigo.startsWith('1')) {
        activo.push(grupo);
      } else if (cuenta.codigo.startsWith('2')) {
        pasivo.push(grupo);
      } else if (cuenta.codigo.startsWith('3')) {
        patrimonio.push(grupo);
      }
    }

    const totalActivo = activo.reduce((sum, c) => sum + c.saldo, 0);
    const totalPasivo = pasivo.reduce((sum, c) => sum + c.saldo, 0);
    const totalPatrimonio = patrimonio.reduce((sum, c) => sum + c.saldo, 0);

    return {
      success: true,
      data: {
        fecha,
        activo: {
          cuentas: activo,
          total: totalActivo,
        },
        pasivo: {
          cuentas: pasivo,
          total: totalPasivo,
        },
        patrimonio: {
          cuentas: patrimonio,
          total: totalPatrimonio,
        },
        totalPasivoPatrimonio: totalPasivo + totalPatrimonio,
        cuadrado: Math.abs(totalActivo - (totalPasivo + totalPatrimonio)) < 0.01,
      },
    };
  }

  async getEstadoResultados(fechaDesde: string, fechaHasta: string) {
    // Obtener cuentas de resultado (Ingresos, Costos, Gastos)
    const cuentasResultado = await this.prisma.planCuenta.findMany({
      where: {
        isActive: true,
        OR: [
          { codigo: { startsWith: '4' } }, // Ingresos
          { codigo: { startsWith: '5' } }, // Costos
          { codigo: { startsWith: '6' } }, // Gastos
        ],
      },
      orderBy: { codigo: 'asc' },
      include: {
        movimientos: {
          where: {
            asiento: {
              anulado: false,
              fecha: {
                gte: new Date(fechaDesde),
                lte: new Date(fechaHasta),
              },
            },
          },
        },
      },
    });

    const ingresos = [];
    const costos = [];
    const gastos = [];

    for (const cuenta of cuentasResultado) {
      const totalDebe = cuenta.movimientos
        .filter((m) => m.tipo === 'DEBE')
        .reduce((sum, m) => sum + m.monto, 0);

      const totalHaber = cuenta.movimientos
        .filter((m) => m.tipo === 'HABER')
        .reduce((sum, m) => sum + m.monto, 0);

      const saldo = totalHaber - totalDebe; // Ingresos son acreedores

      const grupo = {
        cuenta: {
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
        },
        saldo: Math.abs(saldo),
      };

      if (cuenta.codigo.startsWith('4')) {
        ingresos.push(grupo);
      } else if (cuenta.codigo.startsWith('5')) {
        costos.push(grupo);
      } else if (cuenta.codigo.startsWith('6')) {
        gastos.push(grupo);
      }
    }

    const totalIngresos = ingresos.reduce((sum, c) => sum + c.saldo, 0);
    const totalCostos = costos.reduce((sum, c) => sum + c.saldo, 0);
    const totalGastos = gastos.reduce((sum, c) => sum + c.saldo, 0);

    const utilidadBruta = totalIngresos - totalCostos;
    const utilidadNeta = utilidadBruta - totalGastos;

    return {
      success: true,
      data: {
        periodo: {
          desde: fechaDesde,
          hasta: fechaHasta,
        },
        ingresos: {
          cuentas: ingresos,
          total: totalIngresos,
        },
        costos: {
          cuentas: costos,
          total: totalCostos,
        },
        utilidadBruta,
        gastos: {
          cuentas: gastos,
          total: totalGastos,
        },
        utilidadNeta,
      },
    };
  }
}
