import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  telefono!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  consulta!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  origen?: string;
}
