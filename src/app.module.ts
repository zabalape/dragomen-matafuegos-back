import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContentModule } from './content/content.module';
import { DirectusModule } from './directus/directus.module';
import { LeadsModule } from './leads/leads.module';
import { ProductsModule } from './products/products.module';


@Module({
  imports: [DirectusModule, ProductsModule, ContentModule, LeadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

