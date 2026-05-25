import { Injectable } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import { PublicacionBlog, Testimonio } from './content.types';

type PublicacionBlogDirectus = {
  id: string | number;
  slug?: string;
  titulo?: string;
  resumen?: string;
  fechaPublicacion?: string;
  categoria?: string;
  imagen?: string;
};

type TestimonioDirectus = {
  id: string | number;
  nombre?: string;
  empresa?: string;
  mensaje?: string;
  puntuacion?: number;
};

@Injectable()
export class ContentService {
  private readonly blogCollection =
    process.env.DIRECTUS_COLLECTION_BLOG || 'blog';
  private readonly testimonialsCollection =
    process.env.DIRECTUS_COLLECTION_TESTIMONIALS || 'testimonials';

  constructor(private readonly directusService: DirectusService) {}

  async obtenerBlog(): Promise<PublicacionBlog[]> {
    const items = await this.directusService.listItems<PublicacionBlogDirectus>(
      this.blogCollection,
      {
        fields: [
          'id',
          'slug',
          'titulo',
          'resumen',
          'fechaPublicacion',
          'categoria',
          'imagen',
        ],
      },
    );

    return items
      .filter((item) => item.slug && item.titulo)
      .map((item) => this.transformarPublicacionBlog(item));
  }

  async obtenerBlogPorSlug(slug: string): Promise<PublicacionBlog | null> {
    try {
      const items =
        await this.directusService.listItems<PublicacionBlogDirectus>(
          this.blogCollection,
          {
            fields: [
              'id',
              'slug',
              'titulo',
              'resumen',
              'fechaPublicacion',
              'categoria',
              'imagen',
            ],
            filter: {
              slug: {
                _eq: slug,
              },
            },
            limit: 1,
          },
        );

      return items[0] ? this.transformarPublicacionBlog(items[0]) : null;
    } catch (error) {
      console.error('Error en obtenerBlogPorSlug:', error);
      return null;
    }
  }

  async obtenerTestimonios(): Promise<Testimonio[]> {
    const items = await this.directusService.listItems<TestimonioDirectus>(
      this.testimonialsCollection,
      {
        fields: ['id', 'nombre', 'empresa', 'mensaje', 'puntuacion'],
      },
    );

    return items
      .filter((item) => item.nombre && item.mensaje)
      .map((item) => this.transformarTestimonio(item));
  }

  async obtenerTestimonioPorId(id: string): Promise<Testimonio | null> {
    try {
      const items = await this.directusService.listItems<TestimonioDirectus>(
        this.testimonialsCollection,
        {
          fields: ['id', 'nombre', 'empresa', 'mensaje', 'puntuacion'],
          filter: {
            id: {
              _eq: id,
            },
          },
          limit: 1,
        },
      );

      return items[0] ? this.transformarTestimonio(items[0]) : null;
    } catch (error) {
      console.error('Error en obtenerTestimonioPorId:', error);
      return null;
    }
  }

  private transformarPublicacionBlog(
    item: PublicacionBlogDirectus,
  ): PublicacionBlog {
    return {
      id: String(item.id),
      slug: item.slug || '',
      titulo: item.titulo || '',
      resumen: item.resumen?.trim() || '',
      fechaPublicacion: item.fechaPublicacion || new Date().toISOString(),
      categoria: item.categoria || undefined,
      imagen: item.imagen || undefined,
    };
  }

  private transformarTestimonio(item: TestimonioDirectus): Testimonio {
    return {
      id: String(item.id),
      nombre: item.nombre || '',
      empresa: item.empresa?.trim() || '',
      mensaje: item.mensaje || '',
      puntuacion: Number(item.puntuacion || 0),
    };
  }
}
