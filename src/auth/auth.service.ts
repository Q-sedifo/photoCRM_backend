import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: { email: string; password: string }, res: any) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      expiresIn: '7d',
    });

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        refreshToken,
      },
    });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    };
  }

  async getMe(adminId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
      },
    });

    return admin;
  }

  async logout(req: any, res: any) {
    const token = req.cookies?.refresh_token;

    if (token) {
      const payload = this.jwt.decode(token) as any;

      await this.prisma.admin.update({
        where: { id: payload.sub },
        data: {
          refreshToken: null,
        },
      });
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { success: true };
  }

  async refresh(req: any, res: any) {
    const token = req.cookies?.refresh_token;

    if (!token) {
      throw new UnauthorizedException();
    }

    const payload = this.jwt.verify(token);

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || admin.refreshToken !== token) {
      throw new UnauthorizedException();
    }

    const newAccessToken = this.jwt.sign(
      { sub: admin.id },
      { expiresIn: '15m' },
    );

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { success: true };
  }
}
