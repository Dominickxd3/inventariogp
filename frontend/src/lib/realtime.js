const EQUIPO_KEYS = [
  ['equipos'], ['equipos-dashboard'], ['equipo'], ['equipos-tipos'],
  ['equipos-tipos-asignables'], ['equipos-disponibles'], ['equipo-inicial'],
  ['equipos-search-incidencia'], ['dashboard'], ['dashboard-ultimas-asignaciones'],
  ['historial-equipo'], ['timeline-equipo'], ['componentes-equipo'], ['caracteristicas-equipo'],
];

const COMPONENTE_KEYS = [
  ['componentes'], ['componente-detalle'], ['componentes-tipos'],
  ['componentes-disponibles'], ['componentes-equipo'],
];

const ASIGNACION_KEYS = [
  ['asignaciones'], ['asignacion-detalle'], ['actas'], ['dashboard'],
  ['dashboard-ultimas-asignaciones'], ['trabajador'], ['trabajadores'],
  ['equipos-activos-trabajador'], ['historial-trabajador'], ['accesorios-trabajador'],
  ['trabajador-equipos'], ['cesar-accesorios'], ['equipos-disponibles'],
  ['equipo-inicial'], ['historial-equipo'], ['timeline-equipo'],
];

const ACCESORIO_KEYS = [
  ['accesorios-trabajador'], ['accesorios-disponibles-asig'], ['componentes'],
  ['componentes-disponibles'], ['cesar-accesorios'], ['trabajador'], ['trabajadores'],
];

const ACTA_KEYS = [
  ['actas'], ['asignaciones'], ['asignacion-detalle'], ['dashboard'],
  ['dashboard-ultimas-asignaciones'],
];

const INCIDENCIA_KEYS = [
  ['incidencias'], ['incidencias-equipo'], ['incidencias-equipo-select'],
  ['equipos'], ['equipos-dashboard'], ['equipo'], ['timeline-equipo'],
  ['historial-equipo'], ['dashboard'],
];

const CONFIGURACION_KEYS = [
  ['configuracion-equipo'], ['equipo'], ['equipos'], ['equipos-dashboard'],
  ['timeline-equipo'],
];

export const EVENTO_QUERY_KEYS = {
  'equipo.created': EQUIPO_KEYS,
  'equipo.updated': EQUIPO_KEYS,
  'equipo.deleted': EQUIPO_KEYS,
  'componente.created': COMPONENTE_KEYS,
  'componente.updated': COMPONENTE_KEYS,
  'componente.deleted': COMPONENTE_KEYS,
  'configuracion.updated': CONFIGURACION_KEYS,
  'accesorio.vinculado': [...COMPONENTE_KEYS, ['equipo'], ['equipos'], ['equipos-dashboard']],
  'accesorio.desvinculado': [...COMPONENTE_KEYS, ['equipo'], ['equipos'], ['equipos-dashboard']],
  'asignacion.created': [...ASIGNACION_KEYS, ...EQUIPO_KEYS],
  'asignacion.updated': [...ASIGNACION_KEYS, ...EQUIPO_KEYS],
  'accesorio.asignado': ACCESORIO_KEYS,
  'accesorio.cesado': ACCESORIO_KEYS,
  'acta.generada': ACTA_KEYS,
  'acta.firmada': ACTA_KEYS,
  'acta.anulada': ACTA_KEYS,
  'acta.enlace-regenerado': ACTA_KEYS,
  'incidencia.created': INCIDENCIA_KEYS,
  'incidencia.updated': INCIDENCIA_KEYS,
};

export function invalidarPorEvento(queryClient, tipo) {
  const keys = EVENTO_QUERY_KEYS[tipo];
  if (!keys) return;
  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}