import { Producto } from './products.types';

export const productosSemilla: Producto[] = [
  {
    id: 'p-001',
    slug: 'matafuego-polvo-abc-5kg',
    nombre: 'Matafuego Polvo ABC 5kg',
    marca: 'DragoMen',
    categoria: 'matafuegos',
    descripcion: 'Equipo multiproposito para fuego clase A, B y C.',
    precioArs: 132000,
    stock: 14,
    destacado: true,
  },
  {
    id: 'p-002',
    slug: 'matafuego-co2-3-5kg',
    nombre: 'Matafuego CO2 3.5kg',
    marca: 'DragoMen',
    categoria: 'matafuegos',
    descripcion: 'Ideal para tableros electricos y equipos sensibles.',
    precioArs: 218000,
    stock: 7,
    destacado: true,
  },
  {
    id: 'p-003',
    slug: 'servicio-recarga-matafuego',
    nombre: 'Servicio de Recarga y Prueba Hidraulica',
    marca: 'DragoMen',
    categoria: 'servicios',
    descripcion: 'Mantenimiento certificado para hogares, comercio e industria.',
    precioArs: 48500,
    stock: 999,
    destacado: false,
  },
];
