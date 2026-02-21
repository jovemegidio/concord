import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { RegisterDto, LoginDto, AuthResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
      },
    });

    // Create a default personal tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: `${dto.displayName}'s Workspace`,
        slug: `${dto.displayName.toLowerCase().replace(/\s+/g, '-')}-${uuid().substring(0, 6)}`,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
        // Create default communication server
        servers: {
          create: {
            name: 'General',
            isDefault: true,
            channels: {
              create: [
                { name: 'general', type: 'TEXT', position: 0 },
                { name: 'random', type: 'TEXT', position: 1 },
                { name: 'voice', type: 'VOICE', position: 2 },
              ],
            },
          },
        },
      },
    });

    return this.generateAuthResponse(user.id);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date(), status: 'ONLINE' },
    });

    return this.generateAuthResponse(user.id);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    // Find the session
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old session
    await this.prisma.session.delete({ where: { id: session.id } });

    return this.generateAuthResponse(session.userId);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.session.deleteMany({
        where: { userId, refreshToken },
      });
    } else {
      // Logout from all sessions
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }

    // Update status
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE' },
    });

    // Clear Redis cache
    await this.redisService.del(`user:${userId}:status`);
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
      },
    });
  }

  // ─── Private Helpers ───

  /**
   * Parse a duration string like '7d', '30d', '1h', '15m' to milliseconds.
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  private async generateAuthResponse(userId: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        tenants: {
          include: {
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    // Generate tokens
    const payload = { sub: user.id, email: user.email, displayName: user.displayName };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = uuid();

    // Save refresh token session
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date();
    const durationMs = this.parseDuration(refreshExpiresIn);
    expiresAt.setTime(expiresAt.getTime() + durationMs);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    // Cache user status in Redis
    await this.redisService.set(`user:${user.id}:status`, 'ONLINE', 86400);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      tenants: user.tenants.map((tu) => ({
        id: tu.tenant.id,
        name: tu.tenant.name,
        slug: tu.tenant.slug,
        role: tu.role,
      })),
    };
  }
}
