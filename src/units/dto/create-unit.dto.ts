import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UnitStatusDto {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateUnitDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  pricePerNight: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  cleaningFee: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  maxGuests: number;

  @IsString()
  bedrooms: string;

  @IsString()
  bathrooms: string;

  @IsString()
  sqft: string;

  @IsArray()
  @IsString({ each: true })
  description: string[];

  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @IsOptional()
  @IsEnum(UnitStatusDto)
  status?: UnitStatusDto;

  @IsOptional()
  @IsUrl()
  icalUrl?: string;
}
