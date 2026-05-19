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

  /**
   * Obtiene todas las publicaciones del blog
   */
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

  /**
   * Obtiene una publicación específica del blog por su slug
   */
  async obtenerBlogPorSlug(slug: string): Promise<PublicacionBlog | null> {
    try {
      // Pasamos el filtro estructurado directo en el string de la colección 
      // para evitar los líos de tipos estrictos con objetos filter complejos
      const coleccionConQuery = `${this.blogCollection}?filter[slug][_eq]=${encodeURIComponent(slug)}`;

      const items = await this.directusService.listItems<PublicacionBlogDirectus>(
        coleccionConQuery as any,
        {
          fields: ['id', 'slug', 'titulo', 'resumen', 'fechaPublicacion', 'categoria', 'imagen'],
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
    } catch (error) {
      console.error('Error en obtenerBlogPorSlug:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los testimonios activos
   */
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

  /**
   * Obtiene un testimonio individual por su ID
   */
  async obtenerTestimonioPorId(id: string): Promise<Testimonio | null> {
    try {
      // Usamos la misma estrategia de query string nativa de Directus para buscar por ID
      const coleccionConQuery = `${this.testimonialsCollection}?filter[id][_eq]=${encodeURIComponent(id)}`;

      const items = await this.directusService.listItems<TestimonioDirectus>(
        coleccionConQuery as any,
        {
          fields: ['id', 'nombre', 'empresa', 'mensaje', 'puntuacion'],
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
      console.error('Error en obtenerTestimonioPorId:', error);
      return null;
    }
  }
}
