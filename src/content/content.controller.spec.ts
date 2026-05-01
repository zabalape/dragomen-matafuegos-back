import { Test, TestingModule } from '@nestjs/testing';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

describe('ContentController', () => {
  let controller: ContentController;

  const contentServiceMock: Pick<ContentService, 'obtenerBlog' | 'obtenerTestimonios'> = {
    obtenerBlog: jest.fn().mockResolvedValue([
      {
        id: 'b-1',
        slug: 'primer-post',
        titulo: 'Primer post',
        resumen: 'Resumen',
        fechaPublicacion: '2026-03-01T00:00:00.000Z',
      },
    ]),
    obtenerTestimonios: jest.fn().mockResolvedValue([
      {
        id: 't-1',
        nombre: 'Cliente',
        empresa: 'Empresa',
        mensaje: 'Excelente servicio',
        puntuacion: 5,
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [
        {
          provide: ContentService,
          useValue: contentServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ContentController>(ContentController);
  });

  it('devuelve datos del blog', async () => {
    const blog = await controller.obtenerBlog();

    expect(blog.length).toBeGreaterThan(0);
  });

  it('devuelve datos de testimonios', async () => {
    const testimonios = await controller.obtenerTestimonios();

    expect(testimonios.length).toBeGreaterThan(0);
  });
});
