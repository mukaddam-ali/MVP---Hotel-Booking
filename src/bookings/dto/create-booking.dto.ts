import { IsDateString, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsString()
  unitId: string;

  @IsDateString()
  checkin: string;

  @IsDateString()
  checkout: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  guests: number;
}
