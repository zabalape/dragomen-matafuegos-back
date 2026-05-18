import { Controller, Get, Param } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('blog')
  obtenerBlog() {
    return this.contentService.obtenerBlog();
  }

  @Get('blog/:slug')
  obtenerBlogPorSlug(@Param('slug') slug: string) {
    return this.contentService.obtenerBlogPorSlug(slug);
  }

  @Get('testimonials')
  obtenerTestimonios() {
    return this.contentService.obtenerTestimonios();
  }

  // 👈 NUEVO ENDPOINT: Obtener un testimonio individual por ID
  @Get('testimonials/:id')
  obtenerTestimonioPorId(@Param('id') id: string) {
    return this.contentService.obtenerTestimonioPorId(id);
  }
}
