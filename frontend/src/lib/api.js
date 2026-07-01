const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

export async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Error del servidor');
  return data;
}

export const api = {
  auth: {
    login: (usuario, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, password }) }),
    me: () => request('/auth/me'),
  },
  equipos: {
    list: (params) => request(`/equipos?${new URLSearchParams(params)}`),
    get: (id) => request(`/equipos/${id}`),
    scan: (codigo) => request(`/equipos/scan/${codigo}`),
    create: (data) => request('/equipos', { method: 'POST', body: JSON.stringify(data) }),
    rapido: (data) => request('/equipos/rapido', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/equipos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    baja: (id, motivo) => request(`/equipos/${id}/baja`, { method: 'POST', body: JSON.stringify({ motivo }) }),
    timeline: (id) => request(`/equipos/${id}/timeline`),
    qr: (id) => request(`/equipos/${id}/qr`, { method: 'POST' }),
    dashboard: () => request('/equipos/dashboard'),
    tipos: {
      list: () => request('/equipos/tipos'),
      create: (data) => request('/equipos/tipos', { method: 'POST', body: JSON.stringify(data) }),
    },
    tiposAsignables: () => request('/equipos/tipos-asignables'),
    intervenciones: {
      list: (id) => request(`/equipos/${id}/intervenciones`),
      create: (id, data) => request(`/equipos/${id}/intervenciones`, { method: 'POST', body: JSON.stringify(data) }),
    },
    incidencias: {
      list: (id) => request(`/equipos/${id}/incidencias`),
    },
    caracteristicas: {
      get: (id) => request(`/equipos/${id}/caracteristicas`),
      save: (id, data) => request(`/equipos/${id}/caracteristicas`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    componentes: {
      list: (id) => request(`/equipos/${id}/componentes`),
      add: (id, data) => request(`/equipos/${id}/componentes`, { method: 'POST', body: JSON.stringify(data) }),
      remove: (id, idMov, motivo) => request(`/equipos/${id}/componentes/${idMov}`, { method: 'DELETE', body: JSON.stringify({ motivo }) }),
    },
  },
  trabajadores: {
    search: (params) => request(`/trabajadores?${new URLSearchParams(params)}`),
    get: (id) => request(`/trabajadores/${id}`),
    getByDNI: (dni) => request(`/trabajadores/dni/${dni}`),
    areas: () => request('/trabajadores/areas'),
    sync: () => request('/trabajadores/sync', { method: 'POST' }),
  },
  asignaciones: {
    list: (params) => request(`/asignaciones?${new URLSearchParams(params)}`),
    get: (id) => request(`/asignaciones/${id}`),
    create: (data) => request('/asignaciones', { method: 'POST', body: JSON.stringify(data) }),
    createBulk: (data) => request('/asignaciones/bulk', { method: 'POST', body: JSON.stringify(data) }),
    createConAccesorios: (data) => request('/asignaciones/con-accesorios', { method: 'POST', body: JSON.stringify(data) }),
    cesar: (id, accesorios, extra) => request(`/asignaciones/${id}/cesar`, { method: 'POST', body: JSON.stringify({ accesorios, ...extra }) }),
    cesarTrabajador: (idTrabajador) => request(`/asignaciones/cesar-trabajador/${idTrabajador}`, { method: 'POST' }),
    linkedAccs: (id) => request(`/asignaciones/${id}/accesorios`),
    acta: (id) => request(`/asignaciones/${id}/acta`),
    detalle: (id) => request(`/asignaciones/${id}/detalle`),
    historialEquipo: (id) => request(`/asignaciones/equipo/${id}`),
    historialTrabajador: (id) => request(`/asignaciones/trabajador/${id}`),
    activasTrabajador: (id) => request(`/asignaciones/trabajador/${id}/activas`),
  },
  incidencias: {
    list: (params) => request(`/incidencias?${new URLSearchParams(params)}`),
    listByEquipo: (id) => request(`/incidencias?idEquipo=${id}`),
    get: (id) => request(`/incidencias/${id}`),
    create: (data) => request('/incidencias', { method: 'POST', body: JSON.stringify(data) }),
    cerrar: (id) => request(`/incidencias/${id}/cerrar`, { method: 'POST' }),
  },
  componentes: {
    list: (params) => request(`/componentes?${new URLSearchParams(params)}`),
    get: (id) => request(`/componentes/${id}`),
    detalle: (id) => request(`/componentes/${id}/detalle`),
    create: (data) => request('/componentes', { method: 'POST', body: JSON.stringify(data) }),
    createQuick: (data) => request('/componentes/rapido', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/componentes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    baja: (id) => request(`/componentes/${id}/baja`, { method: 'POST' }),
    accesoriosDisponibles: () => request('/componentes/accesorios-disponibles'),
    accesoriosPorTrabajador: (id) => request(`/componentes/accesorios-por-trabajador/${id}`),
    tipos: {
      list: () => request('/componentes/tipos'),
      create: (data) => request('/componentes/tipos', { method: 'POST', body: JSON.stringify(data) }),
    },
  },
};
