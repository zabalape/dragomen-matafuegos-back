import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(async () => {
    process.env.DIRECTUS_URL = 'http://directus.test';
    process.env.DIRECTUS_COLLECTION_PRODUCTS = 'products';
    process.env.DIRECTUS_COLLECTION_BLOG = 'blog';
    process.env.DIRECTUS_COLLECTION_TESTIMONIALS = 'testimonials';
    process.env.DIRECTUS_COLLECTION_LEADS = 'leads';
    process.env.LEADS_ADMIN_TOKEN = 'test-admin-token';

    const productos = [
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
        descripcion:
          'Mantenimiento certificado para hogares, comercio e industria.',
        precioArs: 48500,
        stock: 999,
        destacado: false,
      },
    ];

    const blog = [
      {
        id: 'b-1',
        slug: 'primer-post',
        titulo: 'Primer post',
        resumen: 'Resumen',
        fechaPublicacion: '2026-03-01T00:00:00.000Z',
      },
    ];

    const leads: Array<Record<string, unknown>> = [];

    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input, init) => {
        const rawUrl =
          input instanceof URL
            ? input.href
            : typeof input === 'string'
              ? input
              : input.url;
        const url = new URL(rawUrl);
        const method = init?.method || 'GET';
        const pathname = url.pathname;

        if (pathname === '/items/products' && method === 'GET') {
          const data = filtrarProductos(productos, url);
          return new Response(
            JSON.stringify({
              data,
              meta: {
                filter_count: data.length,
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        if (pathname === '/items/blog' && method === 'GET') {
          return new Response(JSON.stringify({ data: blog }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (pathname === '/items/testimonials' && method === 'GET') {
          return new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (pathname === '/items/leads' && method === 'POST') {
          const body = init?.body ? JSON.parse(String(init.body)) : {};
          const lead = {
            id: `lead-${leads.length + 1}`,
            ...body,
          };
          leads.unshift(lead);
          return new Response(JSON.stringify({ data: lead }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (pathname === '/items/leads' && method === 'GET') {
          const limit = Number(url.searchParams.get('limit') || 100);
          return new Response(JSON.stringify({ data: leads.slice(0, limit) }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({ errors: [{ message: 'Not mocked' }] }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    delete process.env.LEADS_ADMIN_TOKEN;
    fetchSpy.mockRestore();
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.estado).toBe('ok');
        expect(res.body.servicio).toBe('backend');
      });
  });

  it('/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length).toBeGreaterThan(0);
        expect(res.body.items[0]).toHaveProperty('slug');
        expect(res.body.items[0]).toHaveProperty('marca');
        expect(res.body).toHaveProperty('pagina');
        expect(res.body).toHaveProperty('totalPaginas');
      });
  });

  it('/products?categoria=servicios (GET)', () => {
    return request(app.getHttpServer())
      .get('/products?categoria=servicios')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length).toBeGreaterThan(0);
        expect(
          res.body.items.every(
            (item: { categoria: string }) => item.categoria === 'servicios',
          ),
        ).toBe(true);
      });
  });

  it('/products?destacado=true (GET)', () => {
    return request(app.getHttpServer())
      .get('/products?destacado=true')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length).toBeGreaterThan(0);
        expect(
          res.body.items.every(
            (item: { destacado: boolean }) => item.destacado,
          ),
        ).toBe(true);
      });
  });

  it('/products?q=co2 (GET)', () => {
    return request(app.getHttpServer())
      .get('/products?q=co2')
      .expect(200)
      .expect((res) => {
        expect(res.body.items.length).toBeGreaterThan(0);
        expect(
          res.body.items.some((item: { slug: string }) =>
            item.slug.includes('co2'),
          ),
        ).toBe(true);
      });
  });

  it('/products?orden=precio_desc&limite=1&pagina=1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/products?orden=precio_desc&limite=1&pagina=1')
      .expect(200)
      .expect((res) => {
        expect(res.body.items.length).toBe(1);
        expect(res.body.items[0].slug).toBe('matafuego-co2-3-5kg');
        expect(res.body.pagina).toBe(1);
      });
  });

  it('/products?destacado=si (GET)', () => {
    return request(app.getHttpServer())
      .get('/products?destacado=si')
      .expect(400);
  });

  it('/products?orden=invalido (GET)', () => {
    return request(app.getHttpServer())
      .get('/products?orden=invalido')
      .expect(400);
  });

  it('/blog (GET)', () => {
    return request(app.getHttpServer())
      .get('/blog')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('titulo');
      });
  });

  it('/leads (POST/GET)', async () => {
    await request(app.getHttpServer())
      .post('/leads')
      .send({
        nombre: 'Gabriel',
        telefono: '1122334455',
        consulta: 'Necesito cotizacion para matafuegos',
        origen: 'test_e2e',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.nombre).toBe('Gabriel');
      });

    await request(app.getHttpServer())
      .get('/leads?limite=5')
      .set('x-admin-token', 'test-admin-token')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('consulta');
      });
  });

  it('/leads (GET sin token)', () => {
    return request(app.getHttpServer()).get('/leads').expect(401);
  });

  it('/leads (POST invalido)', () => {
    return request(app.getHttpServer())
      .post('/leads')
      .send({
        nombre: 'A',
        telefono: '12',
        consulta: 'x',
      })
      .expect(400);
  });
});

function filtrarProductos<T extends ProductoE2e>(
  productos: T[],
  url: URL,
): T[] {
  let resultado = [...productos];
  const categoria = obtenerParametroPorSufijo(url, '[categoria][_eq]');
  const destacado = obtenerParametroPorSufijo(url, '[destacado][_eq]');
  const slug = obtenerParametroPorSufijo(url, '[slug][_eq]');
  const termino = obtenerParametroPorSufijo(url, '[_contains]')?.toLowerCase();

  if (categoria) {
    resultado = resultado.filter(
      (producto) => producto.categoria === categoria,
    );
  }

  if (destacado) {
    resultado = resultado.filter(
      (producto) => String(producto.destacado) === destacado,
    );
  }

  if (slug) {
    resultado = resultado.filter((producto) => producto.slug === slug);
  }

  if (termino) {
    resultado = resultado.filter((producto) =>
      [
        producto.nombre,
        producto.descripcion,
        producto.categoria,
        producto.marca,
      ]
        .join(' ')
        .toLowerCase()
        .includes(termino),
    );
  }

  const sort = url.searchParams.get('sort');
  if (sort === '-precioArs') {
    resultado.sort((a, b) => b.precioArs - a.precioArs);
  }

  const limit = Number(url.searchParams.get('limit') || resultado.length);
  const page = Number(url.searchParams.get('page') || 1);
  const offset = (page - 1) * limit;

  return resultado.slice(offset, offset + limit);
}

function obtenerParametroPorSufijo(
  url: URL,
  suffix: string,
): string | undefined {
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('filter') && key.endsWith(suffix)) {
      return value;
    }
  }

  return undefined;
}

type ProductoE2e = {
  slug: string;
  nombre: string;
  marca: string;
  categoria: string;
  descripcion: string;
  precioArs: number;
  destacado: boolean;
};
