import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'stream';
import { DirectusService } from '../directus/directus.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly directusService: DirectusService) {}

  @Get(':id')
  async obtenerImagen(@Param('id') id: string, @Res() res: Response) {
    try {
      // 1. Buscamos el stream del asset a través de tu servicio actualizado
      const { stream, contentType } = await this.directusService.obtenerStreamAsset(id);

      // 2. Definimos cabeceras de imagen y caché agresiva (un año) para máxima optimización
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      // 3. Convertimos el Web Stream de fetch en un Node Stream y lo inyectamos en la respuesta
      const nodeStream = Readable.fromWeb(stream as any);
      nodeStream.pipe(res);
    } catch (error) {
      // Si la imagen no se encuentra o el id está roto, responde con un 404 limpio sin romper Next.js
      res.status(HttpStatus.NOT_FOUND).send('Imagen no encontrada');
    }
  }
}