export interface Unidad {
  id: number;
  codigo: string;
  nombre: string;
}

export interface CreateUnidadRequest {
  codigo: string;
  nombre: string;
}

export interface UpdateUnidadRequest {
  codigo: string;
  nombre: string;
}