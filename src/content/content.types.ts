export type PublicacionBlog = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  fechaPublicacion: string;
  categoria?: string; // 👈 Agregado opcional para la etiqueta (ej. "Matafuegos")
  imagen?: string; // 👈 Agregado opcional para el UUID de la foto de Directus
};

export type Testimonio = {
  id: string;
  nombre: string;
  empresa: string;
  mensaje: string;
  puntuacion: number;
};
