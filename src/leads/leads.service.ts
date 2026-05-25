import { Injectable } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import { Lead } from './leads.types';

type CrearLeadPayload = {
  nombre: string;
  telefono: string;
  consulta: string;
  origen: string;
};

type LeadDirectus = {
  id: string | number;
  nombre?: string;
  telefono?: string;
  consulta?: string;
  origen?: string;
  marcaTemporal?: string;
};

@Injectable()
export class LeadsService {
  private readonly leadsCollection =
    process.env.DIRECTUS_COLLECTION_LEADS || 'leads';

  constructor(private readonly directusService: DirectusService) {}

  async crearLead(payload: CrearLeadPayload): Promise<Lead> {
    const marcaTemporal = new Date().toISOString();
    const creado = await this.directusService.createItem<
      CrearLeadPayload & { marcaTemporal: string },
      LeadDirectus
    >(this.leadsCollection, {
      nombre: payload.nombre,
      telefono: payload.telefono,
      consulta: payload.consulta,
      origen: payload.origen,
      marcaTemporal,
    });

    return {
      id: String(creado.id),
      nombre: creado.nombre || payload.nombre,
      telefono: creado.telefono || payload.telefono,
      consulta: creado.consulta || payload.consulta,
      origen: creado.origen || payload.origen,
      marcaTemporal: creado.marcaTemporal || marcaTemporal,
    };
  }

  async obtenerLeads(limite = 100): Promise<Lead[]> {
    const leads = await this.directusService.listItems<LeadDirectus>(
      this.leadsCollection,
      {
        fields: [
          'id',
          'nombre',
          'telefono',
          'consulta',
          'origen',
          'marcaTemporal',
        ],
        sort: ['-marcaTemporal'],
        limit: limite,
      },
    );

    return leads.map((lead) => ({
      id: String(lead.id),
      nombre: lead.nombre || '',
      telefono: lead.telefono || '',
      consulta: lead.consulta || '',
      origen: lead.origen || 'contacto_web',
      marcaTemporal: lead.marcaTemporal || new Date().toISOString(),
    }));
  }
}
