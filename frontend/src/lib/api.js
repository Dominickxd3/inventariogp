const BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options.headers },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Equipos
  equipos: {
    list: (params) => request(`/equipos?${new URLSearchParams(params)}`),
    get: (id) => request(`/equipos/${id}`),
    scan: (codigo) => request(`/equipos/scan/${codigo}`),
    create: (data) => request('/equipos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/equipos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/equipos/${id}`, { method: 'DELETE' }),
    qr: (id) => request(`/equipos/${id}/qr`, { method: 'POST' }),
    tipos: {
      list: () => request('/equipos/tipos'),
      create: (data) => request('/equipos/tipos', { method: 'POST', body: JSON.stringify(data) }),
    },
    dashboard: () => request('/equipos/dashboard'),
  },

  // Trabajadores
  trabajadores: {
    search: (params) => request(`/trabajadores?${new URLSearchParams(params)}`),
    get: (id) => request(`/trabajadores/${id}`),
    getByDNI: (dni) => request(`/trabajadores/dni/${dni}`),
    areas: () => request('/trabajadores/areas'),
    gerencias: () => request('/trabajadores/gerencias'),
  },

  // Asignaciones
  asignaciones: {
    list: (params) => request(`/asignaciones?${new URLSearchParams(params)}`),
    get: (id) => request(`/asignaciones/${id}`),
    create: (data) => request('/asignaciones', { method: 'POST', body: JSON.stringify(data) }),
    cesar: (id) => request(`/asignaciones/${id}/cesar`, { method: 'POST' }),
    historialEquipo: (id) => request(`/asignaciones/equipo/${id}`),
    historialTrabajador: (id) => request(`/asignaciones/trabajador/${id}`),
  },

  // Incidencias
  incidencias: {
    list: (params) => request(`/incidencias?${new URLSearchParams(params)}`),
    get: (id) => request(`/incidencias/${id}`),
    create: (data) => request('/incidencias', { method: 'POST', body: JSON.stringify(data) }),
    cerrar: (id) => request(`/incidencias/${id}/cerrar`, { method: 'POST' }),
  },

  // Auth
  auth: {
    login: (usuario, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, password }) }),
    me: () => request('/auth/me'),
    crearUsuario: (data) => request('/auth/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Componentes
  componentes: {
    list: (params) => request(`/componentes?${new URLSearchParams(params)}`),
    get: (id) => request(`/componentes/${id}`),
    create: (data) => request('/componentes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/componentes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    tipos: {
      list: () => request('/componentes/tipos'),
      create: (data) => request('/componentes/tipos', { method: 'POST', body: JSON.stringify(data) }),
    },
  },
};
