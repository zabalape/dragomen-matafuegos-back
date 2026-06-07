import { Injectable, NotFoundException } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import {
  FiltrosProductos,
  OrdenProductos,
  Producto,
  RespuestaPaginadaProductos,
} from './products.types';

type ImagenDirectus = string | { id?: string | number } | null;

type ProductoDirectus = {
  id: string | number;
  slug?: string;
  nombre?: string;
  marca?: string;
  imagen?: ImagenDirectus;
  categoria?: string;
  descripcion?: string;
  precioArs?: number;
  stock?: number;
  destacado?: boolean;
  disponible?: boolean;
  especificaciones?: string;
};

type FiltroDirectus = {
  [key: string]:
    | string
    | number
    | boolean
    | FiltroDirectus
    | FiltroDirectus[]
    | undefined;
};

@Injectable()
export class ProductsService {
  private readonly productsCollection =
    process.env.DIRECTUS_COLLECTION_PRODUCTS || 'products';

  constructor(private readonly directusService: DirectusService) {}

  async obtenerTodos(
    filtros: FiltrosProductos = {},
  ): Promise<RespuestaPaginadaProductos> {
    const limite = filtros.limite ?? 6;
    const pagina = filtros.pagina ?? 1;

    const condiciones: FiltroDirectus[] = [
      { slug: { _nnull: true } },
      { nombre: { _nnull: true } },
    ];

    const queryFilters: FiltroDirectus = { _and: condiciones };

    if (filtros.categoria) {
      condiciones.push({ categoria: { _eq: filtros.categoria } });
    }

    if (typeof filtros.destacado === 'boolean') {
      condiciones.push({ destacado: { _eq: filtros.destacado } });
    }

    if (filtros.marca) {
      condiciones.push({ marca: { _eq: filtros.marca } });
    }

    if (filtros.especificaciones) {
      condiciones.push({ especificaciones: { _eq: filtros.especificaciones } });
    }

    if (filtros.soloDisponibles) {
      condiciones.push({
        _or: [
          { stock: { _gt: 0 } },
          { disponible: { _eq: true } },
        ],
      });
    }

    if (filtros.q?.trim()) {
      const termino = filtros.q.trim();
      condiciones.push({
        _or: [
          { nombre: { _contains: termino } },
          { descripcion: { _contains: termino } },
          { categoria: { _contains: termino } },
          { marca: { _contains: termino } },
        ],
      });
    }

    const respuesta =
      await this.directusService.listItemsWithMeta<ProductoDirectus>(
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
            'especificaciones',
          ],
          filter: queryFilters,
          sort: this.mapearOrdenamiento(filtros.orden),
          limit: limite,
          page: pagina,
          meta: 'filter_count',
        },
      );

    const itemsDirectus = respuesta.data;
    const total = respuesta.meta?.filter_count ?? itemsDirectus.length;
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const items = itemsDirectus.map((item) => this.transformarProducto(item));

    return { items, pagina, limite, total, totalPaginas };
  }

  async obtenerPorSlug(slug: string): Promise<Producto> {
    const itemsDirectus =
      await this.directusService.listItems<ProductoDirectus>(
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
            'especificaciones',
          ],
          filter: { slug: { _eq: slug } },
          limit: 1,
        },
      );

    const productoDirectus = itemsDirectus[0];
    if (!productoDirectus) {
      throw new NotFoundException(`Producto con slug '${slug}' no encontrado`);
    }

    return this.transformarProducto(productoDirectus);
  }

  private mapearOrdenamiento(orden: OrdenProductos = 'destacados'): string[] {
    switch (orden) {
      case 'nombre_asc': return ['nombre'];
      case 'nombre_desc': return ['-nombre'];
      case 'precio_asc': return ['precioArs'];
      case 'precio_desc': return ['-precioArs'];
      case 'destacados':
      default: return ['-destacado', 'nombre'];
    }
  }

  private transformarProducto(item: ProductoDirectus): Producto {
    const imagenId = this.obtenerImagenId(item.imagen);

    return {
      id: String(item.id),
      slug: item.slug || '',
      nombre: item.nombre || '',
      marca: item.marca?.trim() || 'Sin marca',
      imagenId: imagenId || undefined,
      
      // Mantenemos la ruta limpia hacia el proxy de NestJS
      imagenUrl: imagenId ? `/assets/${imagenId}` : undefined,
        
      categoria: item.categoria?.trim() || 'general',
      descripcion: item.descripcion?.trim() || '',
      precioArs: Number(item.precioArs || 0),
      stock: Number(item.stock || 0),
      destacado: Boolean(item.destacado),
      especificaciones: item.especificaciones?.trim() || '',
    };
  }

  private obtenerImagenId(imagen?: ImagenDirectus): string | null {
    if (!imagen) return null;
    if (typeof imagen === 'string') return imagen;
    if (imagen.id !== undefined && imagen.id !== null) return String(imagen.id);
    return null;
  }
}