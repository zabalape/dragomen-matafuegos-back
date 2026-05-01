export type PublicacionBlog = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  fechaPublicacion: string;
};

export type Testimonio = {
  id: string;
  nombre: string;
  empresa: string;
  mensaje: string;
  puntuacion: number;
};
