import { DirectusService } from '../directus/directus.service';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let directusService: Pick<DirectusService, 'createItem' | 'listItems'>;

  beforeEach(() => {
    directusService = {
      createItem: jest
        .fn()
        .mockImplementation(async (_collection, payload) => ({
          id: 'lead-1',
          ...payload,
        })),
      listItems: jest.fn().mockResolvedValue([
        {
          id: 'lead-2',
          nombre: 'B',
          telefono: '222222',
          consulta: 'Consulta BBBBB',
          origen: 'test',
          marcaTemporal: '2026-03-23T10:10:00.000Z',
        },
        {
          id: 'lead-1',
          nombre: 'A',
          telefono: '111111',
          consulta: 'Consulta AAAAA',
          origen: 'test',
          marcaTemporal: '2026-03-23T10:00:00.000Z',
        },
      ]),
    };
    service = new LeadsService(directusService as DirectusService);
  });

  it('crea un lead y lo devuelve', async () => {
    const lead = await service.crearLead({
      nombre: 'Gabriel',
      telefono: '1122334455',
      consulta: 'Necesito cotizar matafuegos para local',
      origen: 'test',
    });

    expect(lead.id).toBe('lead-1');
    expect(lead.nombre).toBe('Gabriel');
  });

  it('devuelve leads desde directus', async () => {
    const leads = await service.obtenerLeads();

    expect(leads[0].nombre).toBe('B');
    expect(leads[1].nombre).toBe('A');
  });
});
