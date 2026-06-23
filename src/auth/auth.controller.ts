import { Controller, Body, Get, Req, Res, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req) {
    return this.authService.getMe(req.user.id);
  }

  @Post('login')
  login(@Body() dto: { email: string; password: string }, @Res({ passthrough: true }) res) {
    return this.authService.login(dto, res);
  }

  @Post('refresh')
  refresh(@Req() req, @Res({ passthrough: true }) res) {
    return this.authService.refresh(req, res);
  }

  @Post('logout')
  logout(@Req() req, @Res({ passthrough: true }) res) {
    return this.authService.logout(req, res);
  }
}