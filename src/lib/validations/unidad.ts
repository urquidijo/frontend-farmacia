import { z } from "zod";

export const unidadSchema = z.object({
  codigo: z.string()
    .min(1, "El código es requerido")
    .min(1, "El código debe tener al menos 1 caracter")
    .max(10, "El código no puede exceder 10 caracteres")
    .trim()
    .toUpperCase(),
  nombre: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
});

export type UnidadFormData = z.infer<typeof unidadSchema>;