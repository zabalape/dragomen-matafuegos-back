import { DirectusService } from '../directus/directus.service';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;
  let directusService: Pick<DirectusService, 'listItems'>;

  beforeEach(() => {
    directusService = {
      listItems: jest.fn().mockImplementation(async (collection: string) => {
        if (collection === 'blog') {
          return [
            {
              id: 'b-1',
              slug: 'primer-post',
              titulo: 'Primer post',
              resumen: 'Resumen',
              fechaPublicacion: '2026-03-01T00:00:00.000Z',
            },
          ];
        }

        if (collection === 'testimonials') {
          return [
            {
              id: 't-1',
              nombre: 'Cliente',
              empresa: 'Empresa',
              mensaje: 'Excelente servicio',
              puntuacion: 5,
            },
          ];
        }

        return [];
      }),
    };
    service = new ContentService(directusService as DirectusService);
  });

  it('devuelve publicaciones del blog', async () => {
    const publicaciones = await service.obtenerBlog();

    expect(publicaciones.length).toBeGreaterThan(0);
    expect(publicaciones[0]).toHaveProperty('slug');
  });

  it('devuelve testimonios', async () => {
    const testimonios = await service.obtenerTestimonios();

    expect(testimonios.length).toBeGreaterThan(0);
    expect(testimonios[0]).toHaveProperty('puntuacion');
  });
});
