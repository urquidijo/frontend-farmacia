import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;