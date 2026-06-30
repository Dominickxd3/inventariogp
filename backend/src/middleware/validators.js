import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuario requerido').max(100),
  password: z.string().min(1, 'Contraseña requerida').max(200),
});

export const equipoCreateSchema = z.object({
  CodEquipo: z.string().optional(),
  IdTipodeEquipo: z.number().int().positive('Tipo de equipo requerido'),
  NombreEquipo: z.string().optional(),
  Marca: z.string().optional(),
  Modelo: z.string().optional(),
  Serie: z.string().optional(),
  CodBarra: z.string().optional(),
  Estado: z.string().optional(),
  Obs: z.string().optional(),
}).partial({
  CodEquipo: true,
  NombreEquipo: true,
  Marca: true,
  Modelo: true,
  Serie: true,
  CodBarra: true,
  Estado: true,
  Obs: true,
});

export const componenteCreateSchema = z.object({
  IdTipodeComponente: z.number().int().positive('Tipo de componente requerido'),
  DesComponente: z.string().optional(),
  Marca: z.string().optional(),
  Modelo: z.string().optional(),
  Serie: z.string().optional(),
  Capacidad: z.string().optional(),
  Lote: z.string().optional(),
  Obs: z.string().optional(),
});

export const asignacionCreateSchema = z.object({
  IdTrabajador: z.number().int().positive(),
  IdEquipo: z.number().int().positive(),
  FechaAsignacion: z.string().optional(),
  Obs: z.string().optional(),
});

export const incidenciaCreateSchema = z.object({
  IdEquipo: z.number().int().positive('Equipo requerido'),
  TipoIncidencia: z.string().min(1, 'Tipo de incidencia requerido'),
  Descripcion: z.string().min(1, 'Descripción requerida'),
  Prioridad: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID inválido').transform(Number),
});
