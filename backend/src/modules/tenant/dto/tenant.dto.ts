import { IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  slug: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, any>;
}

export class InviteMemberDto {
  @ApiProperty({ example: 'user@company.com' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'MODERATOR', 'MEMBER', 'GUEST'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'MODERATOR', 'MEMBER', 'GUEST'])
  role?: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER', 'GUEST'] })
  @IsEnum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER', 'GUEST'])
  role: string;
}
