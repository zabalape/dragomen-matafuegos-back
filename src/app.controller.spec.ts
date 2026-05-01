import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('salud', () => {
    it('debe devolver el estado de salud del servicio', () => {
      const resultado = appController.obtenerSalud();

      expect(resultado.estado).toBe('ok');
      expect(resultado.servicio).toBe('backend');
      expect(typeof resultado.marcaTemporal).toBe('string');
    });
  });
});
