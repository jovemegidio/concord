import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ example: 'Product Roadmap' })
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
  color?: string;
}

export class CreateColumnDto {
  @ApiProperty({ example: 'In Progress' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  wipLimit?: number;
}

export class CreateCardDto {
  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] })
  @IsOptional()
  @IsEnum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] })
  @IsOptional()
  @IsEnum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class MoveCardDto {
  @ApiProperty()
  @IsString()
  targetColumnId: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;
}

export class CreateChecklistDto {
  @ApiProperty({ example: 'Deployment Steps' })
  @IsString()
  @MaxLength(200)
  title: string;
}

export class CreateChecklistItemDto {
  @ApiProperty({ example: 'Run migrations' })
  @IsString()
  @MaxLength(500)
  title: string;
}

export class AddCommentDto {
  @ApiProperty({ example: 'Looks good! Ready for review.' })
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class ReorderColumnsDto {
  @ApiProperty({ type: [String] })
  columnIds: string[];
}
