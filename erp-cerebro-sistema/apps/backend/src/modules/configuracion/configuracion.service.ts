import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfiguracionService {
  constructor(private prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // EMPRESA
  // ───────────────────────────────────────────────────────────────────────────

  async getEmpresaConfig() {
    const config = await this.prisma.companyConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    return { success: true, data: config };
  }

  async updateEmpresaConfig(dto: any) {
    const existing = await this.prisma.companyConfig.findFirst();

    if (existing) {
      const updated = await this.prisma.companyConfig.update({
        where: { id: existing.id },
        data: dto,
      });
      return { success: true, data: updated };
    } else {
      const created = await this.prisma.companyConfig.create({
        data: dto,
      });
      return { success: true, data: created };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SISTEMA
  // ───────────────────────────────────────────────────────────────────────────

  async getSistemaConfig(group?: string) {
    const where = group ? { group } : {};

    const configs = await this.prisma.systemConfig.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    // Agrupar por grupo
    const grouped = configs.reduce((acc: any, config: any) => {
      if (!acc[config.group]) {
        acc[config.group] = [];
      }
      acc[config.group].push(config);
      return acc;
    }, {});

    return { success: true, data: grouped };
  }

  async getConfigByGroup(group: string) {
    const configs = await this.prisma.systemConfig.findMany({
      where: { group },
      orderBy: { key: 'asc' },
    });

    return { success: true, data: configs };
  }

  async updateSistemaConfig(key: string, dto: any) {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuración ${key} no encontrada`);
    }

    if (!config.isEditable) {
      throw new NotFoundException('Esta configuración no es editable');
    }

    const updated = await this.prisma.systemConfig.update({
      where: { key },
      data: { value: dto.value },
    });

    return { success: true, data: updated };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TABLAS DEL SISTEMA
  // ───────────────────────────────────────────────────────────────────────────

  async getTablas() {
    const tablas = await this.prisma.systemTable.findMany({
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: tablas };
  }

  async getTablaItems(name: string) {
    const tabla = await this.prisma.systemTable.findUnique({
      where: { name },
      include: {
        items: {
          orderBy: { order: 'asc' },
          where: { isActive: true },
        },
      },
    });

    if (!tabla) {
      throw new NotFoundException(`Tabla ${name} no encontrada`);
    }

    return { success: true, data: tabla.items };
  }

  async createTabla(dto: any) {
    const existing = await this.prisma.systemTable.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new NotFoundException('La tabla ya existe');
    }

    const tabla = await this.prisma.systemTable.create({
      data: dto,
    });

    return { success: true, data: tabla };
  }

  async updateTabla(id: string, dto: any) {
    const tabla = await this.prisma.systemTable.findUnique({
      where: { id },
    });

    if (!tabla) {
      throw new NotFoundException('Tabla no encontrada');
    }

    if (tabla.isSystem) {
      throw new NotFoundException('No se pueden modificar tablas del sistema');
    }

    const updated = await this.prisma.systemTable.update({
      where: { id },
      data: dto,
    });

    return { success: true, data: updated };
  }

  async deleteTabla(id: string) {
    const tabla = await this.prisma.systemTable.findUnique({
      where: { id },
    });

    if (!tabla) {
      throw new NotFoundException('Tabla no encontrada');
    }

    if (tabla.isSystem) {
      throw new NotFoundException('No se pueden eliminar tablas del sistema');
    }

    await this.prisma.systemTable.delete({
      where: { id },
    });

    return { success: true, message: 'Tabla eliminada exitosamente' };
  }

  async createTablaItem(tablaId: string, dto: any) {
    const item = await this.prisma.systemTableItem.create({
      data: {
        ...dto,
        tableId: tablaId,
      },
    });

    return { success: true, data: item };
  }

  async updateTablaItem(itemId: string, dto: any) {
    const item = await this.prisma.systemTableItem.update({
      where: { id: itemId },
      data: dto,
    });

    return { success: true, data: item };
  }

  async deleteTablaItem(itemId: string) {
    await this.prisma.systemTableItem.delete({
      where: { id: itemId },
    });

    return { success: true, message: 'Elemento eliminado exitosamente' };
  }
}
