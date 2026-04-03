import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ───────────────────────────────────────────────────────────────────────────

  async login(email: string, password: string, mfaToken?: string, ip?: string) {
    // 1. Buscar usuario con rol y permisos
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
            modules: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si está activo
    if (!user.isActive) {
      throw new ForbiddenException('Usuario inactivo. Contacte al administrador.');
    }

    // 3. Verificar si está bloqueado
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new ForbiddenException(
        `Usuario bloqueado hasta ${user.lockedUntil.toLocaleString()}`,
      );
    }

    // 4. Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Incrementar intentos fallidos
      await this.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 5. Verificar MFA si está habilitado
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return { requiresMfa: true, userId: user.id };
      }

      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token: mfaToken,
        window: this.config.get('MFA_WINDOW') || 1,
      });

      if (!isValid) {
        throw new UnauthorizedException('Código MFA inválido');
      }
    }

    // 6. Resetear intentos fallidos y actualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        lastLoginIP: ip,
      },
    });

    // 7. Generar tokens
    const tokens = await this.generateTokens(user);

    // 8. Guardar sesión
    await this.saveSession(user.id, tokens.accessToken, ip);

    // 9. Preparar respuesta (sin datos sensibles)
    const { passwordHash, mfaSecret, ...userWithoutSensitive } = user;

    return {
      success: true,
      data: {
        user: {
          ...userWithoutSensitive,
          role: {
            ...user.role,
            permissions: user.role.permissions.map(p => ({
              module: p.module,
              action: p.action,
              resource: p.resource,
            })),
            modules: user.role.modules,
          },
        },
        tokens,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ───────────────────────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string) {
    try {
      // 1. Verificar refresh token
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // 2. Buscar usuario y sesión
      const session = await this.prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { role: true } } },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Sesión expirada');
      }

      // 3. Generar nuevos tokens
      const tokens = await this.generateTokens(session.user);

      // 4. Actualizar sesión
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return { success: true, data: tokens };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ───────────────────────────────────────────────────────────────────────────

  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: { userId, token },
    });

    return { success: true, message: 'Sesión cerrada exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MFA SETUP
  // ───────────────────────────────────────────────────────────────────────────

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const secret = speakeasy.generateSecret({
      name: `${this.config.get('MFA_ISSUER')} (${user.email})`,
      length: 32,
    });

    // Guardar secreto temporalmente (se activa al verificar)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    return {
      success: true,
      data: {
        secret: secret.base32,
        qrCode: secret.otpauth_url!,
      },
    };
  }

  async verifyMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA no configurado');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: this.config.get('MFA_WINDOW') || 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { success: true, message: 'MFA activado exitosamente' };
  }

  async disableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA no está activado');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret!,
      encoding: 'base32',
      token,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    return { success: true, message: 'MFA desactivado exitosamente' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private async incrementFailedAttempts(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) return;

    const newAttempts = user.failedAttempts + 1;
    const maxAttempts = 5;
    const lockoutDuration = 15; // minutos

    if (newAttempts >= maxAttempts) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedAttempts: newAttempts,
          lockedUntil: new Date(Date.now() + lockoutDuration * 60 * 1000),
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedAttempts: newAttempts },
      });
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      roleName: user.role.name,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '24h',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveSession(userId: string, token: string, ip?: string) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        token,
        ipAddress: ip,
        expiresAt,
      },
    });
  }
}
