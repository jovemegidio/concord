import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, InviteMemberDto } from './dto/tenant.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTenantDto) {
    // Check slug uniqueness
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Organization slug already taken');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        members: {
          create: {
            userId,
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
              ],
            },
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
      },
    });
  }

  async findById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, displayName: true, avatarUrl: true, status: true },
            },
          },
        },
        _count: { select: { servers: true, workspaces: true, pages: true } },
      },
    });

    if (!tenant) throw new NotFoundException('Organization not found');
    return tenant;
  }

  async findUserTenants(userId: string) {
    const memberships = await this.prisma.tenantUser.findMany({
      where: { userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logoUrl: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.tenant,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  async getMembers(tenantId: string) {
    return this.prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async inviteMember(tenantId: string, dto: InviteMemberDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Create invite token for non-existing users
      const token = uuid();
      return this.prisma.tenantInvite.create({
        data: {
          tenantId,
          email: dto.email.toLowerCase(),
          role: (dto.role as any) || 'MEMBER',
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    }

    // Check if already a member
    const existingMembership = await this.prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization');
    }

    // Add member directly
    return this.prisma.tenantUser.create({
      data: {
        tenantId,
        userId: user.id,
        role: (dto.role as any) || 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, email: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async removeMember(tenantId: string, userId: string, requesterId: string) {
    // Can't remove yourself if you're the only owner
    if (userId === requesterId) {
      const owners = await this.prisma.tenantUser.count({
        where: { tenantId, role: 'OWNER' },
      });
      if (owners <= 1) {
        throw new ForbiddenException('Cannot remove the last owner');
      }
    }

    return this.prisma.tenantUser.delete({
      where: { tenantId_userId: { tenantId, userId } },
    });
  }

  async updateMemberRole(tenantId: string, userId: string, role: string) {
    return this.prisma.tenantUser.update({
      where: { tenantId_userId: { tenantId, userId } },
      data: { role: role as any },
    });
  }
}
