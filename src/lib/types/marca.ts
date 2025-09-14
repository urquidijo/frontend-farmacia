export interface Marca {
  id: number;
  nombre: string;
}

export interface CreateMarcaRequest {
  nombre: string;
}

export interface UpdateMarcaRequest {
  nombre: string;
}