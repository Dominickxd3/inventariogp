# 04 — API

> **Propósito**: Documentación de todos los endpoints de la API REST.
> Base URL: `http://127.0.0.1:3001/api`
> Autenticación: JWT en header `Authorization: Bearer <token>`, obtenido vía `POST /api/auth/login`
> Respuesta error estándar: `{ error: string, details?: string, code?: string }`
> **Estado**: ✅ Verificado contra backend/src/index.js y routers

---

## Rutas verificadas

| Archivo | Prefijo |
|---------|---------|
| backend/src/routes/auth.routes.js | `/api/auth` |
| backend/src/routes/equipos.routes.js | `/api/equipos` |
| backend/src/routes/trabajadores.routes.js | `/api/trabajadores` |
| backend/src/routes/asignaciones.routes.js | `/api/asignaciones` |
| backend/src/routes/incidencias.routes.js | `/api/incidencias` |
| backend/src/routes/componentes.routes.js | `/api/componentes` |

---

## 1. Auth (`/api/auth`)

### `POST /api/auth/login`

Inicio de sesión. Registra intentos en `Tab_SYS_LoginAudit`.

**Body:**
```json
{ "usuario": "string", "password": "string" }
```

**Respuesta 200:**
```json
{
  "token": "jwt...",
  "usuario": { "IdUsuario": 1, "Usuario": "admin", "Rol": "ADMIN", "IdTrabajador": 1, "Nombres": "Admin Sistemas" }
}
```

**Errores:** 401 (credenciales inválidas), 403 (usuario inactivo)

### `GET /api/auth/me`

Devuelve el usuario autenticado desde `req.usuario`.

### `GET /api/auth/audit`

Log de intentos de login (solo ADMIN).

---

## 2. Equipos (`/api/equipos`)

### `GET /api/equipos`

Lista paginada y filtrada. **Query params:** `search`, `tipo`, `estado`, `page` (default 1), `pageSize` (default 25)

**Respuesta 200:**
```json
{ "data": [{ "IdMaeEquipo": 1, "CodEquipo": "EQ-001", "DesTipodeEquipo": "LAPTOP", ... }], "total": 150, "page": 1, "pageSize": 25, "totalPages": 6 }
```

### `GET /api/equipos/dashboard`

Estadísticas agregadas desde `EquiposRepository.getDashboardStats()`.

### `GET /api/equipos/tipos`

Catálogo de tipos de equipo desde `Tab_EQ_TipodeEquipos`.

### `GET /api/equipos/tipos-asignables`

Tipos de equipo que pueden asignarse.

### `GET /api/equipos/scan/:codigo`

Busca equipo por `CodBarra`.

### `GET /api/equipos/:id`

Detalle del equipo.

### `GET /api/equipos/:id/timeline`

Línea de tiempo de cambios de estado.

### `POST /api/equipos`

Crear equipo. Requiere ADMIN o TECNICO.

**Body:** `{ IdTipodeEquipo, CodEquipo?, NombreEquipo?, Marca?, Modelo?, Serie?, CodBarra?, Obs? }`

### `POST /api/equipos/rapido`

Creación rápida (mismos campos).

### `PUT /api/equipos/:id`

Actualizar equipo.

### `POST /api/equipos/:id/baja`

Dar de baja un equipo. Requiere ADMIN.

### `POST /api/equipos/:id/qr`

Generar QR del equipo.

### `POST /api/equipos/tipos`

Crear tipo de equipo. Requiere ADMIN.

### `GET /api/equipos/:id/caracteristicas`

Características técnicas del equipo.

### `PUT /api/equipos/:id/caracteristicas`

Actualizar características.

### `GET /api/equipos/:id/componentes`

Componentes instalados en el equipo.

### `POST /api/equipos/:id/componentes`

Agregar componente al equipo. Requiere ADMIN o TECNICO.

### `DELETE /api/equipos/:id/componentes/:idMovComponente`

Retirar componente del equipo.

### `POST /api/equipos/:id/estado`

Cambiar estado del equipo. Requiere ADMIN.

### `GET /api/equipos/:id/historial-estados`

Historial de cambios de estado.

### `GET /api/equipos/:id/incidencias`

Incidencias del equipo.

### `GET /api/equipos/:id/intervenciones`

Intervenciones del equipo.

### `POST /api/equipos/:id/intervenciones`

Registrar intervención.

---

## 3. Trabajadores (`/api/trabajadores`)

### `GET /api/trabajadores`

Lista paginada y filtrada.

**Query params:** `search`, `sede`, `cargo`, `area`, `page`, `pageSize`

**Respuesta 200:**
```json
{
  "data": [{ "IdTrabajador": 1, "DOI": "...", "NombreTrabajador": "...", "ConEquipos": 1, ... }],
  "total": 200, "page": 1, "pageSize": 25, "totalPages": 8,
  "stats": { "total": 200, "conEquipos": 45, "sinEquipos": 155 }
}
```

### `POST /api/trabajadores/sync`

Sincronizar desde ERP. Requiere ADMIN.

### `GET /api/trabajadores/areas`

Lista de áreas distintas.

### `GET /api/trabajadores/stats`

Estadísticas rápidas.

### `GET /api/trabajadores/:id`

Detalle del trabajador.

### `GET /api/trabajadores/dni/:dni`

Buscar por DNI.

---

## 4. Asignaciones (`/api/asignaciones`)

### `GET /api/asignaciones`

Lista paginada. **Query params:** `search`, `estado`, `page`, `pageSize`

### `GET /api/asignaciones/:id`

Asignación por ID.

### `GET /api/asignaciones/:id/detalle`

Detalle completo con equipo, trabajador, accesorios y timeline.

### `POST /api/asignaciones`

Crear asignación simple. Requiere ADMIN o TECNICO.

**Body:** `{ IdEquipo, IdTrabajador, FechaAsignacion?, Obs? }`

### `POST /api/asignaciones/bulk`

Asignación múltiple (varios equipos a un trabajador).

### `POST /api/asignaciones/con-accesorios`

Asignación con accesorios.

### `POST /api/asignaciones/:id/cesar`

Cesar asignación. Requiere ADMIN o TECNICO.

**Body:**
```json
{
  "Motivo": "DEVOLUCION|RENUNCIA|CAMBIO|TRASLADO|DANADO|MANTENIMIENTO|PERDIDO|ROBADO|EXTRAVIADO",
  "Obs": "string (max 500)",
  "accesorios": [{ "idMovAccesorio": 1, "accion": "DISPONIBLE|MANTENER|BAJA|PERDIDO" }]
}
```

**Respuesta 200:** `{ "message": "Asignación finalizada" }`

**Errores:** 409 (accesorios no coinciden, duplicados, asignación no vigente), 422 (MANTENER no implementado)

### `GET /api/asignaciones/:id/accesorios`

Accesorios vinculados a la asignación.

### `POST /api/asignaciones/cesar-trabajador/:idTrabajador`

Cesar todas las asignaciones activas de un trabajador. Requiere ADMIN.

### `GET /api/asignaciones/:id/acta`

Acta de entrega en HTML.

### `GET /api/asignaciones/equipo/:idEquipo`

Historial de asignaciones de un equipo.

### `GET /api/asignaciones/trabajador/:idTrabajador`

Historial de asignaciones de un trabajador.

### `GET /api/asignaciones/trabajador/:idTrabajador/activas`

Asignaciones activas de un trabajador.

---

## 5. Componentes (`/api/componentes`)

### `GET /api/componentes`

Lista paginada y filtrada.

**Query params:** `search`, `tipo`, `estado`, `page`, `pageSize`, `idTrabajador`

### `GET /api/componentes/tipos`

Catálogo de tipos de componente.

### `GET /api/componentes/accesorios-disponibles`

Accesorios disponibles para asignar.

### `GET /api/componentes/accesorios-por-trabajador/:idTrabajador`

Accesorios asignados a un trabajador.

### `GET /api/componentes/:id/detalle`

Detalle del componente con historial.

### `POST /api/componentes/:id/baja`

Dar de baja un componente.

### `GET /api/componentes/:id`

Componente por ID.

### `POST /api/componentes`

Crear componente.

### `POST /api/componentes/rapido`

Creación rápida.

### `PUT /api/componentes/:id`

Actualizar componente.

### `POST /api/componentes/tipos`

Crear tipo de componente.

---

## 6. Incidencias (`/api/incidencias`)

### `GET /api/incidencias`

Lista paginada. **Query params:** `search`, `estado`, `prioridad`, `page`, `pageSize`

### `GET /api/incidencias/:id`

Detalle de la incidencia.

### `POST /api/incidencias`

Crear incidencia. Requiere ADMIN o TECNICO.

**Body:** `{ IdMaeEquipo, TipoIncidencia, Descripcion, Prioridad? }`

### `POST /api/incidencias/:id/cerrar`

Cerrar incidencia. Requiere ADMIN o TECNICO.

---

## Convenciones de la API

| Convención | Detalle |
|------------|---------|
| Nombres de endpoints | kebab-case, plural |
| Paginación | `page` (1-indexed) + `pageSize`; respuesta incluye `total`, `totalPages` |
| Búsqueda | Parámetro `search` para búsqueda textual general |
| Fechas | Formato ISO (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss`) |
| Respuestas de lista | Siempre `{ data: [], total, page, pageSize, totalPages }` |
| Códigos de error | 400 (validación Zod), 401 (no auth), 403 (rol incorrecto), 404 (no encontrado), 409 (conflicto), 422 (no implementado), 500 (error interno) |
