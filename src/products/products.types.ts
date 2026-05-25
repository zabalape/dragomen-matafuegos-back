export type Producto = {
  id: string;
  slug: string;
  nombre: string;
  marca: string;
  imagenId?: string;
  imagenUrl?: string;
  categoria: string;
  descripcion: string;
  precioArs: number;
  stock: number;
  destacado: boolean;
  especificaciones?: string; // ← Añadido el campo de especificaciones
};

export type FiltrosProductos = {
  categoria?: string;
  destacado?: boolean;
  q?: string;
  orden?: OrdenProductos;
  pagina?: number;
  limite?: number;
};

export type OrdenProductos =
  | 'nombre_asc'
  | 'nombre_desc'
  | 'precio_asc'
  | 'precio_desc'
  | 'destacados';

export type RespuestaPaginadaProductos = {
  items: Producto[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};
