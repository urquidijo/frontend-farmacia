export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  stockMinimo: number;
  activo: boolean;
  marcaId: number;
  categoriaId: number;
  unidadId: number;
  creado_en: string;
  actualizado_en: string;
  // Relaciones opcionales para mostrar en la tabla
  marca?: { id: number; nombre: string };
  categoria?: { id: number; nombre: string };
  unidad?: { id: number; nombre: string };
}

export interface CreateProductoRequest {
  nombre: string;
  descripcion: string;
  stockMinimo: number;
  activo: boolean;
  marcaId: number;
  categoriaId: number;
  unidadId: number;
}

export interface UpdateProductoRequest {
  nombre: string;
  descripcion: string;
  stockMinimo: number;
  activo: boolean;
  marcaId: number;
  categoriaId: number;
  unidadId: number;
}