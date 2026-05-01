import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { OrdenProductos } from '../products.types';

export class ObtenerProductosQueryDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsBooleanString()
  destacado?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc', 'destacados'])
  orden?: OrdenProductos;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limite?: number;
}
