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

  @IsOptional()
  @IsString()
  type?: string;

  // Active nightly rate (derived from season; still accepted directly for compat)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  pricePerNight?: number;

  // Seasonal rates
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  winterRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  springRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  summerRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  fallRate?: number;

  @IsOptional()
  @IsString()
  activeSeason?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  cleaningFee: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  petFee?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  maxGuests: number;

  @IsString()
  bedrooms: string;

  @IsString()
  bathrooms: string;

  @IsOptional()
  @IsString()
  sqft?: string;

  @IsArray()
  @IsString({ each: true })
  description: string[];

  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  cancellationHours?: number;

  @IsOptional()
  @IsEnum(UnitStatusDto)
  status?: UnitStatusDto;

  @IsOptional()
  @IsUrl()
  icalUrl?: string;
}
