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
  private readonly blogCollection = process.env.DIRECTUS_COLLECTION_BLOG || 'blog';
  private readonly testimonialsCollection =
    process.env.DIRECTUS_COLLECTION_TESTIMONIALS || 'testimonials';

  constructor(private readonly directusService: DirectusService) {}

  async obtenerBlog(): Promise<PublicacionBlog[]> {
    const items = await this.directusService.listItems<PublicacionBlogDirectus>(
      this.blogCollection,
      {
        fields: ['id', 'slug', 'titulo', 'resumen', 'fechaPublicacion', 'categoria', 'imagen'],
      },
    );

    return items
      .filter((item) => item.slug && item.titulo)
      .map((item) => ({
        id: String(item.id),
        slug: item.slug || '',
        titulo: item.titulo || '',
        resumen: item.resumen?.trim() || '',
        fechaPublicacion: item.fechaPublicacion || new Date().toISOString(),
        categoria: item.categoria || undefined,
        imagen: item.imagen || undefined,
      }));
  }

  // 🛠️ CORREGIDO: Buscamos usando listItems y filter plano como espera tu DirectusService
  async obtenerBlogPorSlug(slug: string): Promise<PublicacionBlog | null> {
    const items = await this.directusService.listItems<PublicacionBlogDirectus>(
      this.blogCollection,
      {
        fields: ['id', 'slug', 'titulo', 'resumen', 'fechaPublicacion', 'categoria', 'imagen'],
        // Usamos una query plana en lugar de un objeto anidado para evitar el error de Primitive[]
        filter: {
          slug: slug, 
        } as any, // Metemos el cast temporal para blindarlo contra el tipado estricto de tu wrapper
      },
    );

    if (!items || items.length === 0) {
      return null;
    }

    const item = items[0];

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

  async obtenerTestimonios(): Promise<Testimonio[]> {
    const items = await this.directusService.listItems<TestimonioDirectus>(
      this.testimonialsCollection,
      {
        fields: ['id', 'nombre', 'empresa', 'mensaje', 'puntuacion'],
      },
    );

    return items
      .filter((item) => item.nombre && item.mensaje)
      .map((item) => ({
        id: String(item.id),
        nombre: item.nombre || '',
        empresa: item.empresa?.trim() || '',
        mensaje: item.mensaje || '',
        puntuacion: Number(item.puntuacion || 0),
      }));
  }

  // 🛠️ CORREGIDO: Reemplazamos readItem por listItems filtrando por ID plano
  async obtenerTestimonioPorId(id: string): Promise<Testimonio | null> {
    try {
      const items = await this.directusService.listItems<TestimonioDirectus>(
        this.testimonialsCollection,
        {
          fields: ['id', 'nombre', 'empresa', 'mensaje', 'puntuacion'],
          filter: {
            id: id,
          } as any,
        },
      );

      if (!items || items.length === 0) {
        return null;
      }

      const item = items[0];

      return {
        id: String(item.id),
        nombre: item.nombre || '',
        empresa: item.empresa?.trim() || '',
        mensaje: item.mensaje || '',
        puntuacion: Number(item.puntuacion || 0),
      };
    } catch (error) {
      return null;
    }
  }
}
