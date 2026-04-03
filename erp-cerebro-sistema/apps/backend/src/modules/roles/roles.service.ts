import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true,
        modules: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: roles };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        modules: true,
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return { success: true, data: role };
  }

  async create(createRoleDto: any) {
    const existing = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new ConflictException('El nombre del rol ya existe');
    }

    const role = await this.prisma.role.create({
      data: {
        ...createRoleDto,
        permissions: createRoleDto.permissions
          ? {
              create: createRoleDto.permissions.map((p: any) => ({
                module: p.module,
                action: p.action,
                resource: p.resource,
              })),
            }
          : undefined,
        modules: createRoleDto.modules
          ? {
              create: createRoleDto.modules.map((m: any) => ({
                moduleGroup: m.moduleGroup,
                moduleName: m.moduleName,
                canView: m.canView ?? true,
                canEdit: m.canEdit ?? false,
                canDelete: m.canDelete ?? false,
                canExport: m.canExport ?? false,
                canReport: m.canReport ?? true,
              })),
            }
          : undefined,
      },
      include: {
        permissions: true,
        modules: true,
      },
    });

    return { success: true, data: role };
  }

  async update(id: string, updateRoleDto: any) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.isSystem) {
      throw new BadRequestException('No se pueden modificar roles del sistema');
    }

    if (updateRoleDto.name) {
      const existing = await this.prisma.role.findFirst({
        where: {
          name: updateRoleDto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('El nombre del rol ya existe');
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        ...updateRoleDto,
        permissions: updateRoleDto.permissions
          ? {
              deleteMany: {},
              create: updateRoleDto.permissions.map((p: any) => ({
                module: p.module,
                action: p.action,
                resource: p.resource,
              })),
            }
          : undefined,
        modules: updateRoleDto.modules
          ? {
              deleteMany: {},
              create: updateRoleDto.modules.map((m: any) => ({
                moduleGroup: m.moduleGroup,
                moduleName: m.moduleName,
                canView: m.canView ?? true,
                canEdit: m.canEdit ?? false,
                canDelete: m.canDelete ?? false,
                canExport: m.canExport ?? false,
                canReport: m.canReport ?? true,
              })),
            }
          : undefined,
      },
      include: {
        permissions: true,
        modules: true,
      },
    });

    return { success: true, data: updatedRole };
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.isSystem) {
      throw new BadRequestException('No se pueden eliminar roles del sistema');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { success: true, message: 'Rol eliminado exitosamente' };
  }
}
