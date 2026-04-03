import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { RolesModule } from '../modules/roles/roles.module';
import { ConfiguracionModule } from '../modules/configuracion/configuracion.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ConfiguracionModule,
  ],
})
export class AppModule {}
