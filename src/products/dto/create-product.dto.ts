import { IsString, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}
