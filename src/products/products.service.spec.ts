import { NotFoundException } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let directusService: Pick<
    DirectusService,
    'listItems' | 'listItemsWithMeta' | 'construirUrlAsset'
  >;

  const productoMock = {
    id: 'p-001',
    slug: 'matafuego-polvo-abc-5kg',
    nombre: 'Matafuego Polvo ABC 5kg',
    marca: 'DragoMen',
    imagen: 'asset-1',
    categoria: 'matafuegos',
    descripcion: 'Equipo multiproposito para fuego clase A, B y C.',
    precioArs: 132000,
    stock: 14,
    destacado: true,
    specifications: 'ABC',
  };

  beforeEach(() => {
    directusService = {
      listItems: jest.fn().mockResolvedValue([productoMock]),
      listItemsWithMeta: jest.fn().mockResolvedValue({
        data: [productoMock],
        meta: {
          filter_count: 3,
        },
      }),
      construirUrlAsset: jest.fn(
        (fileId: string) => `http://directus.test/assets/${fileId}`,
      ),
    };
    service = new ProductsService(directusService as DirectusService);
  });

  it('devuelve productos paginados con total desde meta de Directus', async () => {
    const respuesta = await service.obtenerTodos({ limite: 1, pagina: 2 });

    expect(respuesta.items).toHaveLength(1);
    expect(respuesta.total).toBe(3);
    expect(respuesta.totalPaginas).toBe(3);
    expect(respuesta.items[0]).toMatchObject({
      slug: 'matafuego-polvo-abc-5kg',
      imagenUrl: 'http://directus.test/assets/asset-1',
    });
  });

  it('envia filtros, orden y paginacion a Directus', async () => {
    await service.obtenerTodos({
      categoria: 'matafuegos',
      destacado: true,
      q: 'co2',
      orden: 'precio_desc',
      limite: 12,
      pagina: 3,
    });

    expect(directusService.listItemsWithMeta).toHaveBeenCalledWith(
      'products',
      expect.objectContaining({
        filter: expect.objectContaining({
          _and: expect.arrayContaining([
            { categoria: { _eq: 'matafuegos' } },
            { destacado: { _eq: true } },
            expect.objectContaining({
              _or: expect.arrayContaining([{ nombre: { _contains: 'co2' } }]),
            }),
          ]),
        }),
        sort: ['-precioArs'],
        limit: 12,
        page: 3,
        meta: 'filter_count',
      }),
    );
  });

  it('devuelve un producto por slug', async () => {
    const producto = await service.obtenerPorSlug('matafuego-polvo-abc-5kg');

    expect(producto.nombre).toContain('Matafuego');
    expect(directusService.listItems).toHaveBeenCalledWith(
      'products',
      expect.objectContaining({
        filter: {
          slug: {
            _eq: 'matafuego-polvo-abc-5kg',
          },
        },
        limit: 1,
      }),
    );
  });

  it('lanza error cuando el slug no existe', async () => {
    jest.mocked(directusService.listItems).mockResolvedValueOnce([]);

    await expect(service.obtenerPorSlug('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
