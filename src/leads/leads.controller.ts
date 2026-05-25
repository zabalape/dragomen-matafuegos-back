import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
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
  obtenerLeads(
    @Query() query: ObtenerLeadsQueryDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-admin-token') adminToken?: string,
  ) {
    this.validarTokenAdmin(authorization, adminToken);
    return this.leadsService.obtenerLeads(query.limite ?? 100);
  }

  private validarTokenAdmin(authorization?: string, adminToken?: string) {
    const tokenConfigurado = process.env.LEADS_ADMIN_TOKEN?.trim();

    if (!tokenConfigurado) {
      throw new ServiceUnavailableException(
        'LEADS_ADMIN_TOKEN no configurado en el backend',
      );
    }

    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;

    if (adminToken !== tokenConfigurado && bearerToken !== tokenConfigurado) {
      throw new UnauthorizedException('Token administrativo invalido');
    }
  }
}
