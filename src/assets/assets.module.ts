import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { DirectusModule } from '../directus/directus.module'; // Ajustá la ruta según tu estructura

@Module({
  imports: [DirectusModule],
  controllers: [AssetsController],
})
export class AssetsModule {}