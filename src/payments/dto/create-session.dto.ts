import { IsString, IsUrl } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  bookingId: string;

  @IsUrl({ require_tld: false })
  successUrl: string;

  @IsUrl({ require_tld: false })
  cancelUrl: string;
}
