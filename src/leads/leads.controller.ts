import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CrearLeadDto } from './dto/crear-lead.dto';
import { ObtenerLeadsQueryDto } from './dto/obtener-leads-query.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  crearLead(@Body() body: CrearLeadDto) {
    return this.leadsService.crearLead({
      nombre: body.nombre.trim(),
      telefono: body.telefono.trim(),
      consulta: body.consulta.trim(),
      origen: body.origen?.trim() || 'contacto_web',
    });
  }

  @Get()
  obtenerLeads(@Query() query: ObtenerLeadsQueryDto) {
    return this.leadsService.obtenerLeads(query.limite ?? 100);
  }
}
