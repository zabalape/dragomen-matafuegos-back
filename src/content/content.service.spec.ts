import { DirectusService } from '../directus/directus.service';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;
  let directusService: Pick<DirectusService, 'listItems'>;

  const blog = [
    {
      id: 'b-1',
      slug: 'primer-post',
      titulo: 'Primer post',
      resumen: ' Resumen ',
      fechaPublicacion: '2026-03-01T00:00:00.000Z',
      categoria: 'Matafuegos',
      imagen: 'asset-blog',
    },
  ];

  const testimonios = [
    {
      id: 't-1',
      nombre: 'Cliente',
      empresa: ' Empresa ',
      mensaje: 'Muy buen servicio',
      puntuacion: 5,
    },
  ];

  beforeEach(() => {
    directusService = {
      listItems: jest.fn().mockImplementation(async (collection, params) => {
        if (collection === 'blog') {
          const slug = params?.filter?.slug?._eq;
          return slug ? blog.filter((item) => item.slug === slug) : blog;
        }

        if (collection === 'testimonials') {
          const id = params?.filter?.id?._eq;
          return id
            ? testimonios.filter((item) => item.id === id)
            : testimonios;
        }

        return [];
      }),
    };

    service = new ContentService(directusService as DirectusService);
  });

  it('devuelve publicaciones de blog validas', async () => {
    const publicaciones = await service.obtenerBlog();

    expect(publicaciones).toEqual([
      expect.objectContaining({
        id: 'b-1',
        slug: 'primer-post',
        resumen: 'Resumen',
      }),
    ]);
  });

  it('devuelve una publicacion por slug', async () => {
    const publicacion = await service.obtenerBlogPorSlug('primer-post');

    expect(publicacion?.titulo).toBe('Primer post');
  });

  it('devuelve null si no encuentra la publicacion', async () => {
    const publicacion = await service.obtenerBlogPorSlug('inexistente');

    expect(publicacion).toBeNull();
  });

  it('devuelve testimonios', async () => {
    const resultado = await service.obtenerTestimonios();

    expect(resultado[0]).toMatchObject({
      id: 't-1',
      empresa: 'Empresa',
      puntuacion: 5,
    });
  });

  it('devuelve un testimonio por id', async () => {
    const resultado = await service.obtenerTestimonioPorId('t-1');

    expect(resultado?.nombre).toBe('Cliente');
  });
});
