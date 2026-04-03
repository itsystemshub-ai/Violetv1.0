import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.id) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // ADMIN tiene acceso total
    if (user.roleName === 'ADMIN') {
      return true;
    }

    const userPermissions = user.role?.permissions?.map(
      p => `${p.module}:${p.action}`
    ) || [];

    const hasAllPermissions = requiredPermissions.every(permission => {
      if (permission.endsWith(':*')) {
        const module = permission.split(':')[0];
        return userPermissions.some(p => p.startsWith(`${module}:`));
      }
      return userPermissions.includes(permission);
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `No tienes permisos para esta acción. Requerido: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}

export const RequirePermissions = (...permissions: string[]) =>
  require('@nestjs/common').SetMetadata('permissions', permissions);
