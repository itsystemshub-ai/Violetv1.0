import { Controller, Post, Get, Body, Req, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, MfaSetupDto, MfaVerifyDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.mfaToken,
      req.ip,
    );
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(req.user.sub, token);
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  async setupMfa(@Req() req: any) {
    return this.authService.setupMfa(req.user.sub);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  async verifyMfa(@Req() req: any, @Body() mfaVerifyDto: MfaVerifyDto) {
    return this.authService.verifyMfa(req.user.sub, mfaVerifyDto.token);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  async disableMfa(@Req() req: any, @Body() mfaVerifyDto: MfaVerifyDto) {
    return this.authService.disableMfa(req.user.sub, mfaVerifyDto.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return { success: true, data: req.user };
  }
}
