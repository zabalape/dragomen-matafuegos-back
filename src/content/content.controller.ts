import { Controller, Get } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('blog')
  obtenerBlog() {
    return this.contentService.obtenerBlog();
  }

  @Get('testimonials')
  obtenerTestimonios() {
    return this.contentService.obtenerTestimonios();
  }
}
