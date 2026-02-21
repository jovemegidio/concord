import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({ example: 'Project Documentation' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: '📄' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;
}

export class UpdatePageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateBlockDto {
  @ApiProperty({
    enum: [
      'PARAGRAPH', 'HEADING_1', 'HEADING_2', 'HEADING_3',
      'BULLETED_LIST', 'NUMBERED_LIST', 'TODO', 'TOGGLE',
      'CODE', 'QUOTE', 'DIVIDER', 'IMAGE', 'TABLE', 'CALLOUT', 'EMBED',
    ],
  })
  @IsEnum([
    'PARAGRAPH', 'HEADING_1', 'HEADING_2', 'HEADING_3',
    'BULLETED_LIST', 'NUMBERED_LIST', 'TODO', 'TOGGLE',
    'CODE', 'QUOTE', 'DIVIDER', 'IMAGE', 'TABLE', 'CALLOUT', 'EMBED',
  ])
  type: string;

  @ApiProperty()
  content: any;

  @ApiPropertyOptional()
  @IsOptional()
  properties?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentBlockId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateBlockDto {
  @ApiPropertyOptional()
  @IsOptional()
  content?: any;

  @ApiPropertyOptional()
  @IsOptional()
  properties?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class ReorderBlocksDto {
  @ApiProperty({ type: [String] })
  blockIds: string[];
}
