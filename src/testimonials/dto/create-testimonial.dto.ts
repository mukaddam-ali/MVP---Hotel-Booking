import { IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTestimonialDto {
  @IsString()
  guestName: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order?: number;
}
