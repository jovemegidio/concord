import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServerDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;
}

export class CreateChannelDto {
  @ApiProperty({ example: 'frontend-team' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ enum: ['TEXT', 'VOICE', 'ANNOUNCEMENT', 'FORUM'] })
  @IsOptional()
  @IsEnum(['TEXT', 'VOICE', 'ANNOUNCEMENT', 'FORUM'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Hello team! 👋' })
  @IsString()
  @MaxLength(4000)
  content: string;

  @ApiPropertyOptional({ enum: ['TEXT', 'IMAGE', 'FILE', 'EMBED'] })
  @IsOptional()
  @IsEnum(['TEXT', 'IMAGE', 'FILE', 'EMBED'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  attachments?: any;
}

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  content: string;
}

export class AddReactionDto {
  @ApiProperty({ example: '👍' })
  @IsString()
  emoji: string;
}

export class GetMessagesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  before?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
