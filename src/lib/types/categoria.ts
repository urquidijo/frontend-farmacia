export interface Categoria {
  id: number;
  nombre: string;
}

export interface CreateCategoriaRequest {
  nombre: string;
}

export interface UpdateCategoriaRequest {
  nombre: string;
}