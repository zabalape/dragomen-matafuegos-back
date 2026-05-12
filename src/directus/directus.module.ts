import { Global, Module } from '@nestjs/common';
import { DirectusService } from './directus.service';
import { DirectusInitializationService } from './directus-initialization.service';

@Global()
@Module({
  providers: [DirectusService, DirectusInitializationService],
  exports: [DirectusService, DirectusInitializationService],
})
export class DirectusModule {}
