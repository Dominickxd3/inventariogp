import { z } from 'zod';

export const actaValidarSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  ultimosCuatroDni: z.string().length(4, 'Deben ser exactamente 4 dígitos').regex(/^\d{4}$/, 'Solo dígitos'),
});

export const actaFirmarSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  ultimosCuatroDni: z.string().length(4, 'Deben ser exactamente 4 dígitos').regex(/^\d{4}$/, 'Solo dígitos'),
  aceptaCondiciones: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar las condiciones' }) }),
  firmaBase64: z.string().min(100, 'La firma es demasiado corta o está vacía'),
});

export const actaAnularSchema = z.object({
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500),
});

export const actaRegenerarEnlaceSchema = z.object({
  horas: z.number().int().positive().max(720).optional(),
});
