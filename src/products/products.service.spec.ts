import { NotFoundException } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let directusService: Pick<DirectusService, 'listItems'>;

  const productosMock = [
    {
      id: 'p-001',
      slug: 'matafuego-polvo-abc-5kg',
      nombre: 'Matafuego Polvo ABC 5kg',
      marca: 'DragoMen',
      categoria: 'matafuegos',
      descripcion: 'Equipo multiproposito para fuego clase A, B y C.',
      precioArs: 132000,
      stock: 14,
      destacado: true,
    },
    {
      id: 'p-002',
      slug: 'matafuego-co2-3-5kg',
      nombre: 'Matafuego CO2 3.5kg',
      marca: 'DragoMen',
      categoria: 'matafuegos',
      descripcion: 'Ideal para tableros electricos y equipos sensibles.',
      precioArs: 218000,
      stock: 7,
      destacado: true,
    },
    {
      id: 'p-003',
      slug: 'servicio-recarga-matafuego',
      nombre: 'Servicio de Recarga y Prueba Hidraulica',
      marca: 'DragoMen',
      categoria: 'servicios',
      descripcion: 'Mantenimiento certificado para hogares, comercio e industria.',
      precioArs: 48500,
      stock: 999,
      destacado: false,
    },
  ];

  beforeEach(() => {
    directusService = {
      listItems: jest.fn().mockResolvedValue(productosMock),
    };
    service = new ProductsService(directusService as DirectusService);
  });

  it('devuelve todos los productos', async () => {
    const respuesta = await service.obtenerTodos();
    const productos = respuesta.items;

    expect(productos.length).toBeGreaterThan(0);
    expect(productos[0]).toHaveProperty('slug');
    expect(productos[0]).toHaveProperty('marca');
    expect(respuesta.total).toBeGreaterThan(0);
  });

  it('devuelve un producto por slug', async () => {
    const producto = await service.obtenerPorSlug('matafuego-polvo-abc-5kg');

    expect(producto.nombre).toContain('Matafuego');
  });

  it('lanza error cuando el slug no existe', async () => {
    await expect(service.obtenerPorSlug('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('filtra productos por categoria', async () => {
    const productos = (await service.obtenerTodos({ categoria: 'servicios' })).items;

    expect(productos.length).toBeGreaterThan(0);
    expect(productos.every((producto) => producto.categoria === 'servicios')).toBe(
      true,
    );
  });

  it('filtra productos por destacado', async () => {
    const productos = (await service.obtenerTodos({ destacado: true })).items;

    expect(productos.length).toBeGreaterThan(0);
    expect(productos.every((producto) => producto.destacado)).toBe(true);
  });

  it('filtra por texto de busqueda', async () => {
    const productos = (await service.obtenerTodos({ q: 'co2' })).items;

    expect(productos.length).toBeGreaterThan(0);
    expect(productos.some((producto) => producto.slug.includes('co2'))).toBe(true);
  });

  it('ordena por precio ascendente', async () => {
    const productos = (await service.obtenerTodos({ orden: 'precio_asc' })).items;

    expect(productos[0].precioArs).toBeLessThanOrEqual(productos[1].precioArs);
  });

  it('pagina resultados', async () => {
    const respuesta = await service.obtenerTodos({
      limite: 1,
      pagina: 2,
      orden: 'nombre_asc',
    });

    expect(respuesta.items.length).toBe(1);
    expect(respuesta.pagina).toBe(2);
    expect(respuesta.totalPaginas).toBeGreaterThan(1);
  });
});
