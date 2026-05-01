export type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  consulta: string;
  origen: string;
  marcaTemporal: string;
};

export type CrearLeadPayload = {
  nombre: string;
  telefono: string;
  consulta: string;
  origen: string;
};
