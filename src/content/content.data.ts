import { PublicacionBlog, Testimonio } from './content.types';

export const blogSemilla: PublicacionBlog[] = [
  {
    id: 'b-001',
    slug: 'como-elegir-matafuego-correcto',
    titulo: 'Como elegir el matafuego correcto para tu comercio',
    resumen: 'Guia simple para cumplir normativa y proteger tu local.',
    fechaPublicacion: '2026-03-05T10:00:00.000Z',
  },
  {
    id: 'b-002',
    slug: 'mantenimiento-anual-obligatorio',
    titulo: 'Mantenimiento anual: que exige la normativa',
    resumen: 'Recarga, control visual y prueba hidraulica sin vueltas.',
    fechaPublicacion: '2026-03-08T14:30:00.000Z',
  },
];

export const testimoniosSemilla: Testimonio[] = [
  {
    id: 't-001',
    nombre: 'Carla Mendoza',
    empresa: 'Panaderia San Martin',
    mensaje: 'Nos resolvieron todo en el dia y con certificado en regla.',
    puntuacion: 5,
  },
  {
    id: 't-002',
    nombre: 'Marcos Ledesma',
    empresa: 'Taller Ledesma',
    mensaje: 'Muy claros con la inspeccion y excelentes tiempos de entrega.',
    puntuacion: 5,
  },
];
