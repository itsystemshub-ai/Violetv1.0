import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: true,
            modules: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado o inactivo');
    }

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      roleId: payload.roleId,
      roleName: payload.roleName,
      role: user.role,
    };
  }
}
