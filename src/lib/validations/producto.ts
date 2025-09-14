import { z } from "zod";

export const productoSchema = z.object({
  nombre: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .trim(),
  descripcion: z.string()
    .min(1, "La descripción es requerida")
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .trim(),
  stockMinimo: z.number()
    .min(0, "El stock mínimo debe ser mayor o igual a 0")
    .max(999999, "El stock mínimo no puede exceder 999,999"),
  activo: z.boolean(),
  marcaId: z.number()
    .min(1, "Debe seleccionar una marca"),
  categoriaId: z.number()
    .min(1, "Debe seleccionar una categoría"),
  unidadId: z.number()
    .min(1, "Debe seleccionar una unidad"),
});

export type ProductoFormData = z.infer<typeof productoSchema>;