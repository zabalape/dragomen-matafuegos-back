import { Injectable } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import { PublicacionBlog, Testimonio } from './content.types';

type PublicacionBlogDirectus = {
  id: string | number;
  slug?: string;
  titulo?: string;
  resumen?: string;
  fechaPublicacion?: string;
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
        fields: ['id', 'slug', 'titulo', 'resumen', 'fechaPublicacion'],
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
      }));
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
}