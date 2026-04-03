import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      throw new NotFoundException('Usuario no encontrado');
    }

    const { passwordHash, mfaSecret, ...result } = user;
    return { success: true, data: result };
  }

  async create(createUserDto: any) {
    // Verificar si existe
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
          { cedula: createUserDto.cedula },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('El email, username o cédula ya están registrados');
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        passwordHash,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { passwordHash: _, ...result } = user;
    return { success: true, data: result };
  }

  async update(id: string, updateUserDto: any) {
    // Verificar si existe
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si actualiza contraseña, hashear
    if (updateUserDto.password) {
      updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { passwordHash, mfaSecret, ...result } = user;
    return { success: true, data: result };
  }

  async remove(id: string) {
    await this.prisma.user.findUnique({
      where: { id },
    });

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true, message: 'Usuario eliminado exitosamente' };
  }
}
