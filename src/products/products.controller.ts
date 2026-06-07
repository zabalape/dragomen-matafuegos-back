import { Controller, Get, Param, Query } from '@nestjs/common';
import { ObtenerProductosQueryDto } from './dto/obtener-productos-query.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  obtenerTodos(@Query() query: ObtenerProductosQueryDto) {
    return this.productsService.obtenerTodos({
      categoria: query.categoria?.trim() || undefined,
      destacado: this.normalizarDestacado(query.destacado),
      marca: query.marca?.trim() || undefined,
      especificaciones: query.especificaciones?.trim() || undefined,
      soloDisponibles: query.soloDisponibles,
      q: query.q?.trim() || undefined,
      orden: query.orden,
      pagina: query.pagina,
      limite: query.limite,
    });
  }

  @Get(':slug')
  obtenerPorSlug(@Param('slug') slug: string) {
    return this.productsService.obtenerPorSlug(slug);
  }

  private normalizarDestacado(valor?: string): boolean | undefined {
    if (!valor) {
      return undefined;
    }

    return valor === 'true';
  }
}
