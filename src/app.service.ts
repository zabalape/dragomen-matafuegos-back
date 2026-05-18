import { Injectable } from '@nestjs/common';


@Injectable()
export class AppService {
  obtenerSalud() {
    return {
      estado: 'ok',
      servicio: 'backend',
      marcaTemporal: new Date().toISOString(),
    };
  }
}
