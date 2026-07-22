# 04 — API

> **Propósito**: Documentación de todos los endpoints de la API REST.
> Base URL: `http://127.0.0.1:3001/api`
> Autenticación: JWT en header `Authorization: Bearer <token>`
> Respuesta error estándar: `{ error: string, details?: string, code?: string }`
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## 1. Auth

### `POST /api/auth/login`

Inicio de sesión. Registra intentos en `EQ_LoginAudit`.

**Body:**
```json
{
  "usuario": "string",
  "password": "string"
}
```

**Respuesta 200:**
```json
{
  "token": "jwt...",
  "usuario": {
    "IdUsuario": 1,
    "Usuario": "admin",
    "Rol": "ADMIN",
    "Area": "SISTEMAS",
    "IdTrabajador": 1,
    "Nombres": "Admin Sistemas"
  }
}
```

**Errores:** 401 (credenciales inválidas), 403 (usuario inactivo)

---

## 2. Equipos

### `GET /api/equipos`

Lista paginada y filtrada de equipos.

**Query params:** `search`, `tipo`, `estado`, `page` (default 1), `pageSize` (default 25)

**Respuesta 200:**
```json
{
  "data": [ { "IdEquipo": 1, "TipoEquipo": "LAPTOP", "Marca": "DELL", ... } ],
  "total": 150,
  "page": 1,
  "pageSize": 25,
  "totalPages": 6
}
```

### `POST /api/equipos`

Crear nuevo equipo. Requiere ADMIN.

**Body:** `{ TipoEquipo, Marca?, Modelo?, NumeroSerie?, CodigoInterno?, CodigoPatrimonial?, Caracteristicas?, IdCreadoPor, FechaIngreso }`

### `PUT /api/equipos/:id`

Actualizar equipo.

### `GET /api/equipos/:id`

Detalle completo del equipo con asignación actual, componentes instalados, últimas intervenciones.

### `POST /api/equipos/baja/:id`

Dar de baja un equipo (requiere ADMIN, que no tenga asignaciones activas).

### `POST /api/equipos/importar`

Importación masiva desde Excel/CSV.

### `GET /api/equipos/tipos`

Lista de tipos de equipo disponibles (desde `EQ_Equipos`, no catálogo separado).

### `GET /api/equipos/scan/:codigo`

Obtener equipo por código QR (busca por `CodigoInterno` o `NumeroSerie`).

---

## 3. Trabajadores

### `GET /api/trabajadores`

Lista paginada y filtrada de trabajadores.

**Query params:** `search`, `sede`, `cargo`, `area`, `page`, `pageSize`, `sortBy?`, `sortOrder?`

**Respuesta 200:**
```json
{
  "data": [ { "IdTrabajador": 1, "DNI": "...", "Nombres": "...", "ConEquipos": 1, ... } ],
  "total": 200,
  "page": 1,
  "pageSize": 25,
  "totalPages": 8,
  "stats": { "total": 200, "conEquipos": 45, "sinEquipos": 155 }
}
```

### `POST /api/trabajadores`

Crear trabajador. ADMIN.

### `PUT /api/trabajadores/:id`

Actualizar trabajador.

### `GET /api/trabajadores/stats`

Estadísticas rápidas: total, con equipos, sin equipos.

### `GET /api/trabajadores/search?q=...`

Búsqueda rápida para combos/selectores (retorna `{ IdTrabajador, Nombres, DNI, Area }`).

---

## 4. Asignaciones

### `GET /api/asignaciones`

Lista paginada. **Query params:** `search`, `estado`, `page`, `pageSize`

### `POST /api/asignaciones`

Crear asignación.

**Body:** `{ IdEquipo, IdTrabajador, FechaAsignacion, accesorios?: [{ IdComponente, Accion }], IdCreadoPor }`

### `POST /api/asignaciones/cesar/:id`

Cesar asignación. **Requiere motivo controlado y observación.**

**Body:** `{ MotivoCese, Obs, accesorios?: [{ idMovAccesorio, accion }] }`

**Respuesta 200:**
```json
{
  "asignacion": { "Estado": "CESADA", "MotivoCese": "...", ... },
  "nuevoEstadoEquipo": "DISPONIBLE"
}
```

### `GET /api/asignaciones/activas/:idTrabajador`

Asignaciones activas de un trabajador.

---

## 5. Componentes

### `GET /api/componentes`

Lista paginada y filtrada.

**Query params:** `search`, `tipo`, `estado`, `page`, `pageSize`

### `POST /api/componentes`

Crear componente.

**Body:** `{ TipoComponente, Marca?, Modelo?, NumeroSerie?, Estado?, Ubicacion?, Observaciones?, IdCreadoPor }`

### `PUT /api/componentes/:id`

Actualizar componente.

### `GET /api/componentes/tipos`

Lista de tipos de componente.

---

## 6. Incidencias

### `GET /api/incidencias`

Lista paginada.

### `POST /api/incidencias`

Crear incidencia.

### `PUT /api/incidencias/:id`

Actualizar (incluye cambiar estado a `CERRADO`).

### `GET /api/incidencias/:id`

Detalle con intervenciones asociadas.

---

## 7. Intervenciones

> ⚠️ **PENDIENTE DE VALIDACIÓN**: No existe ruta `/api/intervenciones`. Las intervenciones se gestionan desde `EquiposService` (`backend/src/services/equipos.service.js`) invocando directamente al repositorio `intervenciones.repository.js`. Puede que no haya endpoints REST dedicados.

---

## 8. Dashboard

> ⚠️ **PENDIENTE DE VALIDACIÓN**: No existe ruta `/api/dashboard`. Las estadísticas del dashboard se obtienen desde `EquiposRepository.getDashboardStats()`.

---

## 9. Mantenimiento

> ⚠️ **PENDIENTE DE VALIDACIÓN**: No existe ruta `/api/mantenimiento/actualizar-dashboard`. No se encontró referencia a `SP_ActualizarDashboard` en el código.

---

## Convenciones de la API

| Convención | Detalle |
|------------|---------|
| Nombres de endpoints | kebab-case, plural (`/api/equipos`, `/api/asignaciones/cesar/:id`) |
| Paginación | `page` (1-indexed) + `pageSize`; respuesta incluye `total`, `totalPages` |
| Búsqueda | Parámetro `search` para búsqueda textual general |
| Fechas | Formato ISO (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss`) |
| Respuestas de lista | Siempre `{ data: [], total, page, pageSize, totalPages }` |
| Códigos de error | 400 (validación), 401 (no auth), 403 (rol incorrecto), 404 (no encontrado), 409 (conflicto/duplicado), 500 (error interno) |
