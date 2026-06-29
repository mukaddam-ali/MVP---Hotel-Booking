import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGalleryImageDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order?: number;
}

export class UpdateGalleryImageDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order?: number;

  @IsOptional()
  @IsString()
  unitId?: string | null;
}
