import { Injectable, NotFoundException } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import {
  FiltrosProductos,
  OrdenProductos,
  Producto,
  RespuestaPaginadaProductos,
} from './products.types';

type ProductoDirectus = {
  id: string | number;
  slug?: string;
  nombre?: string;
  marca?: string;
  imagen?: string | { id?: string | number } | null;
  categoria?: string;
  descripcion?: string;
  precioArs?: number;
  stock?: number;
  destacado?: boolean;
};

@Injectable()
export class ProductsService {
  private readonly productsCollection =
    process.env.DIRECTUS_COLLECTION_PRODUCTS || 'products';

  constructor(private readonly directusService: DirectusService) {}

  async obtenerTodos(
    filtros: FiltrosProductos = {},
  ): Promise<RespuestaPaginadaProductos> {
    const productos = await this.obtenerProductosDesdeDirectus();

    const productosFiltrados = productos.filter((producto) => {
      const coincideCategoria = filtros.categoria
        ? producto.categoria === filtros.categoria
        : true;

      const coincideDestacado =
        typeof filtros.destacado === 'boolean'
          ? producto.destacado === filtros.destacado
          : true;

      const termino = filtros.q?.trim().toLowerCase();
      const coincideBusqueda = termino
        ? `${producto.nombre} ${producto.descripcion} ${producto.categoria}`
            .toLowerCase()
            .includes(termino)
        : true;

      return coincideCategoria && coincideDestacado && coincideBusqueda;
    });

    const productosOrdenados = this.ordenarProductos(
      productosFiltrados,
      filtros.orden,
    );

    const limite = filtros.limite ?? 6;
    const pagina = filtros.pagina ?? 1;
    const total = productosOrdenados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const paginaAjustada = Math.min(Math.max(1, pagina), totalPaginas);
    const indiceInicio = (paginaAjustada - 1) * limite;
    const indiceFin = indiceInicio + limite;
    const items = productosOrdenados.slice(indiceInicio, indiceFin);

    return {
      items,
      pagina: paginaAjustada,
      limite,
      total,
      totalPaginas,
    };
  }

  async obtenerPorSlug(slug: string): Promise<Producto> {
    const productos = await this.obtenerProductosDesdeDirectus();
    const producto = productos.find((item) => item.slug === slug);

    if (!producto) {
      throw new NotFoundException(`Producto con slug '${slug}' no encontrado`);
    }

    return producto;
  }

  private ordenarProductos(
    productos: Producto[],
    orden: OrdenProductos = 'destacados',
  ): Producto[] {
    const copia = [...productos];

    switch (orden) {
      case 'nombre_asc':
        return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
      case 'nombre_desc':
        return copia.sort((a, b) => b.nombre.localeCompare(a.nombre));
      case 'precio_asc':
        return copia.sort((a, b) => a.precioArs - b.precioArs);
      case 'precio_desc':
        return copia.sort((a, b) => b.precioArs - a.precioArs);
      case 'destacados':
      default:
        return copia.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    }
  }

  private async obtenerProductosDesdeDirectus(): Promise<Producto[]> {
    const items = await this.directusService.listItems<ProductoDirectus>(
      this.productsCollection,
      {
        fields: [
          'id',
          'slug',
          'nombre',
          'marca',
          'imagen',
          'categoria',
          'descripcion',
          'precioArs',
          'stock',
          'destacado',
        ],
      },
    );

    return items
      .filter((item) => item.slug && item.nombre)
      .map((item) => {
        const imagenId = this.obtenerImagenId(item.imagen);

        return {
          id: String(item.id),
          slug: item.slug || '',
          nombre: item.nombre || '',
          marca: item.marca?.trim() || 'Sin marca',
          imagenId: imagenId || undefined,
          imagenUrl: imagenId
            ? this.directusService.construirUrlAsset(imagenId)
            : undefined,
          categoria: item.categoria?.trim() || 'general',
          descripcion: item.descripcion?.trim() || '',
          precioArs: Number(item.precioArs || 0),
          stock: Number(item.stock || 0),
          destacado: Boolean(item.destacado),
        };
      });
  }

  private obtenerImagenId(
    imagen?: string | { id?: string | number } | null,
  ): string | null {
    if (!imagen) {
      return null;
    }

    if (typeof imagen === 'string') {
      return imagen;
    }

    if (typeof imagen.id !== 'undefined' && imagen.id !== null) {
      return String(imagen.id);
    }

    return null;
  }
}
