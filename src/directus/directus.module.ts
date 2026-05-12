import { Global, Module } from '@nestjs/common';
import { DirectusService } from './directus.service';
import { DirectusInitializationService } from './directus-initialization.service';

@Global()
@Module({
  providers: [DirectusService],
  exports: [DirectusService],
})
export class DirectusModule {}
