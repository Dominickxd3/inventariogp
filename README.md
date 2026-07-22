# InventarioGP — Sistema de Gestión de Inventario Tecnológico

Sistema web para administrar equipos tecnológicos, componentes, asignaciones a trabajadores, incidencias e intervenciones técnicas del **Grupo Pecuario**. Desarrollado para el área de sistemas/informática.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js 24, Express 4, mssql 11 |
| BD | SQL Server (2019+) |
| Autenticación | JWT (8h expiración) |
| HTTP Client | fetch() nativo (`lib/api.js`) |
| Tablas | @tanstack/react-table 8 |
| QR | qrcode.react + html5-qrcode |

---

## Arquitectura

```
┌─────────────┐     HTTP/JSON     ┌──────────────┐     SQL     ┌────────────┐
│  Frontend   │ ────────────────→ │   Backend    │ ──────────→ │ SQL Server │
│  (React)    │ ←──────────────── │  (Express)   │ ←────────── │            │
│  :5173      │   JWT Bearer      │  :3001       │             │ InventarioGP │
└─────────────┘                   └──────────────┘             └────────────┘
```

---

## Estructura del Proyecto

```
inventariogp/
├── backend/
│   ├── src/
│   │   ├── index.js              # Entry point (Express)
│   │   ├── config/
│   │   │   ├── index.js          # Env vars
│   │   │   └── db.js             # Conexión mssql (pool/query/transaction)
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT + role guard
│   │   │   ├── validate.js       # Zod validation middleware
│   │   │   ├── validators.js     # Schemas Zod
│   │   │   ├── rateLimiter.js    # Login rate limit
│   │   │   └── errorHandler.js   # Error handling
│   │   ├── routes/               # Express routers
│   │   ├── services/             # Business logic
│   │   └── repositories/         # SQL queries
│   ├── migrations/               # SQL migration files
│   └── create_core_tables.sql    # DDL principal
├── frontend/
│   └── src/
│       ├── main.jsx              # Entry point (React)
│       ├── App.jsx               # Routes
│       ├── context/AuthContext.jsx
│       ├── lib/
│       │   ├── api.js            # API client (fetch + token)
│       │   └── utils.js          # formatDate, cn, estadoColor
│       ├── pages/                # Route-level pages
│       └── components/           # Shared UI (shadcn + domain)
└── README.md
```

---

## Base de Datos — InventarioGP

### Tablas Maestras

#### `Tab_EQ_TipodeEquipos`
Catálogo de tipos de equipo (LAPTOP, MONITOR, CELULAR, IMPRESORA, etc.)

| Columna | Tipo | Descripción |
|---|---|---|
| IdTipodeEquipo | INT PK | ID auto |
| CodTipodeEquipo | VARCHAR(10) | Código corto |
| DesTipodeEquipo | VARCHAR(100) | Nombre del tipo |
| Estado | VARCHAR(20) | `ACTIVO` / otros |
| FecCreacion | DATETIME | Default GETDATE() |

#### `Tab_EQ_MaeEquipos`
Catálogo principal de equipos.

| Columna | Tipo | Descripción |
|---|---|---|
| IdMaeEquipo | INT PK | ID auto |
| CodEquipo | VARCHAR(50) | Código interno (ej: LAP-000001) |
| IdTipodeEquipo | INT FK | → `Tab_EQ_TipodeEquipos` |
| NombreEquipo | VARCHAR(200) | Nombre opcional |
| Marca | VARCHAR(100) | |
| Modelo | VARCHAR(100) | |
| Serie | VARCHAR(100) | N° de serie del fabricante |
| SerieFabricante | VARCHAR(100) | Serie alternativa |
| SinSerieVisible | BIT | Si no tiene serie visible |
| CodBarra | VARCHAR(100) | Código de barras / QR |
| Estado | VARCHAR(30) | `DISPONIBLE`, `ASIGNADO`, `MANTENIMIENTO`, `INCIDENCIA`, `BAJA` |
| Obs | VARCHAR(MAX) | |
| EsNuevo | BIT | |
| FecCompra | DATE | |
| GarantiaMeses | INT | |
| FecFinGarantia | DATE | |
| Proveedor | VARCHAR(150) | |
| DocumentoCompra | VARCHAR(100) | |
| FecCreacion | DATETIME | |
| IdUsuarioCrea | INT | |
| FecModificacion | DATETIME | |
| IdUsuarioModifica | INT | |

#### `Tab_EQ_TipodeComponentes`
Catálogo de tipos de componente.

| Columna | Tipo | Descripción |
|---|---|---|
| IdTipodeComponente | INT PK | |
| CodTipodeComponente | VARCHAR(10) | |
| DesTipodeComponente | VARCHAR(100) | Nombre |
| Categoria | VARCHAR(50) | `REPUESTO_TECNICO`, `ACCESORIO`, `CONSUMIBLE` |
| Estado | VARCHAR(20) | `ACTIVO` |
| FecCreacion | DATETIME | |

#### `Tab_EQ_Componentes`
Inventario de componentes (RAM, SSD, cargadores, etc.).

| Columna | Tipo | Descripción |
|---|---|---|
| IdComponente | INT PK | |
| IdTipodeComponente | INT FK | → `Tab_EQ_TipodeComponentes` |
| CodComponente | VARCHAR(50) | Código interno (ej: RAM-000001) |
| DesComponente | VARCHAR(200) | Descripción |
| Marca | VARCHAR(100) | |
| Modelo | VARCHAR(100) | |
| Serie | VARCHAR(100) | |
| Lote | VARCHAR(100) | |
| Capacidad | VARCHAR(100) | |
| Obs | VARCHAR(MAX) | |
| Estado | VARCHAR(20) | `DISPONIBLE`, `ASIGNADO`, `BAJA` |
| IdUsuarioCrea | INT | |
| FecCreacion | DATETIME | |

#### `Tab_EQ_Trabajadores`
Directorio de trabajadores (sincronizado desde RRHH vía `sp_sync_trabajadores_erp`).

| Columna | Tipo | Descripción |
|---|---|---|
| IdTrabajador | INT PK | |
| IdTrabajadorERP | INT | ID del sistema RRHH |
| DOI | VARCHAR(20) | DNI |
| Trabajador | VARCHAR(200) | Nombre completo |
| Area | VARCHAR(100) | |
| Ocupacion | VARCHAR(100) | Cargo |
| Estado | VARCHAR(20) | `ACTIVO` |
| Activo | VARCHAR(1) | `1`/`0` |

#### `Tab_SYS_Usuarios`
Usuarios del sistema (autenticación).

| Columna | Tipo | Descripción |
|---|---|---|
| IdUsuario | INT PK | |
| User_Logon | VARCHAR(50) | Usuario de red |
| User_Fullname | VARCHAR(150) | Nombre completo |
| User_Email | VARCHAR(100) | |
| SwAcceso | VARCHAR(20) | |
| Rol | VARCHAR(20) | `ADMIN`, `TECNICO` |
| FecUltimoAcceso | DATETIME | |
| FecCreacion | DATETIME | |

### Tablas de Movimiento

#### `Tab_EQ_MovEquiposAsignaciones`
Asignaciones de equipos a trabajadores.

| Columna | Tipo | Descripción |
|---|---|---|
| IdMovEquipoAsignacion | INT PK | |
| IdMaeEquipo | INT FK | → `Tab_EQ_MaeEquipos` |
| IdTrabajador | INT FK | → `Tab_EQ_Trabajadores` (referido como `IdReferente`) |
| FecAsignacion | DATE | Default GETDATE() |
| FecCese | DATE | Fecha de fin |
| Estado | VARCHAR(20) | `VIGENTE`, `CESADO` |
| Obs | VARCHAR(MAX) | Motivo + observaciones combinadas |
| IdUsuarioCrea | INT | |
| FecCreacion | DATETIME | |

#### `Tab_EQ_MovEquiposComponentes`
Vinculación de componentes a equipos (instalación/desinstalación).

| Columna | Tipo | Descripción |
|---|---|---|
| IdMovComponente | INT PK | |
| IdMaeEquipo | INT FK | |
| IdComponente | INT FK | |
| FecAsigComponente | DATE | |
| FecBajaComponente | DATE | |
| Estado | VARCHAR(20) | `VIGENTE`, `BAJA` |
| OrigenVinculo | VARCHAR(50) | |
| Motivo | VARCHAR(MAX) | Motivo de baja |
| FecInstalacion | DATE | |
| IdIntervencion | INT | → `Tab_EQ_IntervencionesTecnicas` |
| Obs | VARCHAR(MAX) | |
| IdUsuarioCrea | INT | |

#### `Tab_EQ_MovAccesoriosTrabajador`
Accesorios asignados directamente a trabajadores.

| Columna | Tipo | Descripción |
|---|---|---|
| IdMovAccesorio | INT PK | |
| IdComponente | INT FK | |
| IdReferente | INT | → `Tab_EQ_Trabajadores` |
| FecAsignacion | DATE | |
| FecCese | DATE | |
| Estado | VARCHAR(20) | `VIGENTE`, `CESADO` |
| Obs | VARCHAR(MAX) | |
| IdUsuarioCrea | INT | |
| IdMovEquipoAsignacion | INT | Asignación relacionada |

#### `Tab_EQ_MovEstadosEquipos`
Historial de cambios de estado de equipos.

| Columna | Tipo | Descripción |
|---|---|---|
| IdMovEstado | INT PK | |
| IdMaeEquipo | INT FK | |
| EstadoAnterior | VARCHAR(30) | |
| EstadoNuevo | VARCHAR(30) | |
| IdUsuario | INT | |
| Obs | VARCHAR(MAX) | |
| FecCambio | DATETIME | |

#### `Tab_EQ_Incidencias`
Reporte de incidencias sobre equipos.

| Columna | Tipo | Descripción |
|---|---|---|
| IdIncidencia | INT PK | |
| IdMaeEquipo | INT FK | |
| IdReferente | INT | Trabajador que reporta |
| TipoIncidencia | VARCHAR(50) | |
| Descripcion | VARCHAR(MAX) | |
| FecIncidencia | DATE | |
| FecRegistro | DATETIME | |
| Estado | VARCHAR(20) | `ABIERTO`, `CERRADO` |

#### `Tab_EQ_IntervencionesTecnicas`
Intervenciones técnicas realizadas a equipos.

| Columna | Tipo | Descripción |
|---|---|---|
| IdIntervencion | INT PK | |
| IdMaeEquipo | INT FK | |
| IdIncidencia | INT FK | Opcional |
| IdComponenteInstalado | INT FK | |
| IdComponenteRetirado | INT FK | |
| TipoIntervencion | VARCHAR(50) | `MANTENIMIENTO`, `REEMPLAZO`, `REPARACION`, etc. |
| Descripcion | VARCHAR(MAX) | |
| IdUsuario | INT FK | |
| Estado | VARCHAR(20) | `REGISTRADO` |
| PiezaAfectada | VARCHAR(200) | |
| ComponenteRetiradoNoInventariado | BIT | |
| Resultado | VARCHAR(MAX) | |
| RequiereReparacion | BIT | |
| SoftwareInstalado | VARCHAR(200) | |
| Version | VARCHAR(50) | |
| MotivoBaja | VARCHAR(MAX) | |
| FecIntervencion | DATETIME | |

#### `Tab_EQ_CaracteristicasEquipo`
Pares clave-valor para atributos dinámicos por tipo de equipo.

| Columna | Tipo |
|---|---|
| IdCaracteristica | INT PK |
| IdMaeEquipo | INT FK |
| Clave | VARCHAR(100) |
| Valor | VARCHAR(500) |
| IdPlantilla | INT |
| FecRegistro | DATETIME |
| IdUsuarioCrea | INT |
| IdUsuarioModifica | INT |
| FecModificacion | DATETIME |

#### `Tab_EQ_PlantillaCaracteristicas`
Plantilla que define qué características aplican a cada tipo de equipo.

| Columna | Tipo |
|---|---|
| IdPlantilla | INT PK |
| IdTipodeEquipo | INT FK |
| Clave | VARCHAR(100) |
| Etiqueta | VARCHAR(200) |
| TipoDato | VARCHAR(50) |
| Requerido | BIT |
| Orden | INT |
| Activo | BIT |

#### `Tab_SYS_LoginAudit`
Auditoría de intentos de inicio de sesión.

| Columna | Tipo |
|---|---|
| IdAudit | INT PK |
| User_Logon | VARCHAR(50) |
| FechaIntento | DATETIME |
| Exitoso | BIT |
| DireccionIP | VARCHAR(50) |
| UserAgent | VARCHAR(500) |
| Mensaje | VARCHAR(MAX) |

---

## API — Endpoints

### Autenticación (`/api/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | Login (rate limit 10/15min) |
| GET | `/auth/me` | JWT | Usuario actual |
| GET | `/auth/audit` | ADMIN | Intentos de login |

### Equipos (`/api/equipos`)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/equipos` | — | Listar (paginado, filtros: estado, tipo, search) |
| GET | `/equipos/dashboard` | — | Estadísticas (total, por estado, por tipo) |
| GET | `/equipos/tipos` | — | Tipos de equipo |
| GET | `/equipos/tipos-asignables` | — | Tipos asignables (excluye accesorios) |
| GET | `/equipos/scan/:codigo` | — | Buscar por código QR/barras |
| GET | `/equipos/:id` | — | Detalle (incluye asig actual + componentes) |
| GET | `/equipos/:id/timeline` | — | Línea de tiempo |
| POST | `/equipos` | ADMIN/TECNICO | Crear |
| POST | `/equipos/rapido` | ADMIN/TECNICO | Creación rápida con código auto-generado |
| PUT | `/equipos/:id` | ADMIN/TECNICO | Actualizar |
| POST | `/equipos/:id/baja` | ADMIN | Dar de baja |
| POST | `/equipos/:id/qr` | — | Generar QR |
| POST | `/equipos/tipos` | ADMIN | Crear tipo |
| GET/PUT | `/equipos/:id/caracteristicas` | —/ADMIN+TECNICO | Características |
| GET/POST/DELETE | `/equipos/:id/componentes` | —/ADMIN+TECNICO | Componentes del equipo |
| POST | `/equipos/:id/estado` | ADMIN | Cambiar estado manual |
| GET | `/equipos/:id/historial-estados` | — | Historial de estados |
| GET | `/equipos/:id/incidencias` | — | Incidencias del equipo |
| GET/POST | `/equipos/:id/intervenciones` | —/ADMIN+TECNICO | Intervenciones |

### Trabajadores (`/api/trabajadores`)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/trabajadores` | — | Listar/buscar (paginado, filtros: search, area) |
| GET | `/trabajadores/stats` | — | Total / con equipos / sin equipos |
| GET | `/trabajadores/areas` | — | Áreas disponibles |
| GET | `/trabajadores/:id` | — | Detalle |
| GET | `/trabajadores/dni/:dni` | — | Buscar por DNI |
| POST | `/trabajadores/sync` | ADMIN | Sincronizar desde RRHH |

### Asignaciones (`/api/asignaciones`)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/asignaciones` | — | Listar (paginado, filtros: estado, equipo, trabajador, fechas) |
| GET | `/asignaciones/:id` | — | Detalle |
| GET | `/asignaciones/:id/detalle` | — | Detalle completo con timeline |
| POST | `/asignaciones` | ADMIN/TECNICO | Asignar un equipo |
| POST | `/asignaciones/bulk` | ADMIN/TECNICO | Asignar múltiples equipos a un trabajador |
| POST | `/asignaciones/con-accesorios` | ADMIN/TECNICO | Asignar equipo + accesorios |
| POST | `/asignaciones/:id/cesar` | ADMIN/TECNICO | Cesar asignación (requiere `Motivo` vía enum) |
| GET | `/asignaciones/:id/accesorios` | — | Accesorios vinculados |
| GET | `/asignaciones/:id/acta` | — | Acta de entrega (HTML) |
| POST | `/asignaciones/cesar-trabajador/:id` | ADMIN | Cesar todas las activas de un trabajador |
| GET | `/asignaciones/equipo/:id` | — | Historial por equipo |
| GET | `/asignaciones/trabajador/:id` | — | Historial por trabajador |
| GET | `/asignaciones/trabajador/:id/activas` | — | Asignaciones vigentes del trabajador |

### Incidencias (`/api/incidencias`)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/incidencias` | — | Listar (filtros: estado, tipo, search) |
| GET | `/incidencias/:id` | — | Detalle |
| POST | `/incidencias` | ADMIN/TECNICO | Crear (cambia equipo a INCIDENCIA) |
| POST | `/incidencias/:id/cerrar` | ADMIN/TECNICO | Cerrar (restaura estado del equipo) |

### Componentes (`/api/componentes`)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/componentes` | — | Listar (filtros: estado, tipo, categoría, search) |
| GET | `/componentes/tipos` | — | Tipos de componente |
| GET | `/componentes/accesorios-disponibles` | — | Accesorios disponibles |
| GET | `/componentes/accesorios-por-trabajador/:id` | — | Accesorios de un trabajador |
| GET | `/componentes/:id` | — | Detalle |
| GET | `/componentes/:id/detalle` | — | Detalle con timeline |
| POST | `/componentes` | ADMIN/TECNICO | Crear |
| POST | `/componentes/rapido` | ADMIN/TECNICO | Creación rápida |
| PUT | `/componentes/:id` | ADMIN/TECNICO | Actualizar |
| POST | `/componentes/:id/baja` | ADMIN/TECNICO | Dar de baja |
| POST | `/componentes/tipos` | ADMIN | Crear tipo |

---

## Frontend — Páginas y Rutas

| Ruta | Página | Descripción |
|---|---|---|
| `/login` | Login | Formulario de autenticación |
| `/` | Dashboard | Stats, gráficos por tipo/estado, accesos rápidos |
| `/equipos` | Equipos | CRUD de equipos, filtros, QR, registros rápido |
| `/equipos/:id` | EquipoDetalle | Detalle con tabs (info, características, componentes, intervenciones, timeline, incidencias) |
| `/equipos/scan/:codigo` | EquipoScan | Resultado de escaneo QR |
| `/trabajadores` | Trabajadores | Directorio, búsqueda, filtro por área, sync RRHH |
| `/trabajadores/:id` | TrabajadorDetalle | Info personal, asignaciones activas, histórico |
| `/asignaciones` | Asignaciones | Gestión con wizard creación + detalle drawer + acta PDF |
| `/incidencias` | Incidencias | Registro y cierre de incidencias |
| `/componentes` | Componentes | Inventario con detalle drawer y timeline |
| `/scan` | Scan | Escáner QR por cámara |

---

## Reglas de Negocio

### Estados de equipo
```
DISPONIBLE → ASIGNADO (al asignar a trabajador)
DISPONIBLE → INCIDENCIA (al reportar incidencia)
ASIGNADO   → DISPONIBLE (cese por devolución/renuncia/cambio/traslado)
ASIGNADO   → MANTENIMIENTO (cese por dañado)
ASIGNADO   → BAJA (cese por perdido/robado/extraviado)
ASIGNADO   → INCIDENCIA (incidencia mientras asignado)
CUALQUIERA → BAJA (baja manual por admin)
```

### Ciclo de asignación
1. **Crear**: equipo `DISPONIBLE` → `ASIGNADO`, se crea registro en `Tab_EQ_MovEquiposAsignaciones` con estado `VIGENTE`
2. **Cesar**: se actualiza asignación a `CESADO` con `FecCese`, el equipo cambia según motivo:
   - `DEVOLUCION`, `RENUNCIA`, `CAMBIO`, `TRASLADO` → `DISPONIBLE`
   - `DANADO`, `MANTENIMIENTO` → `MANTENIMIENTO`
   - `PERDIDO`, `ROBADO`, `EXTRAVIADO` → `BAJA`

### Validaciones críticas
- No asignar un equipo no disponible (verifica `Estado = 'DISPONIBLE'` y sin incidencias abiertas)
- No cesar una asignación ya cesada (UPDATE condicional `WHERE Estado = 'VIGENTE'`)
- Doble clic en cese: la transacción verifica `rowsAffected === 1`
- Motivo de cese es obligatorio y debe ser uno del enum
- Las intervenciones pueden instalar/retirar componentes del equipo
- Al crear incidencia, el equipo pasa a estado `INCIDENCIA` (si estaba `ASIGNADO` o `DISPONIBLE`)
- Al cerrar incidencia, restaura al estado anterior

---

## Variables de Entorno (backend/.env)

```env
PORT=3001
NODE_ENV=development

DB_SERVER=127.0.0.1
DB_USER=sa
DB_PASSWORD=tu_password
DB_INVENTARIO=InventarioGP
DB_SIGA=SIGA_ASISTENCIA
DB_GP2024=dbGP_2024_GP

JWT_SECRET=tu_secret_jwt
JWT_EXPIRES_IN=8h

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Instalación y Ejecución

### Requisitos
- Node.js 24+
- SQL Server 2019+
- npm

### Backend
```bash
cd backend
npm install
# Crear backend/.env con las variables de entorno
# Ejecutar migraciones SQL en orden:
#   1. create_core_tables.sql
#   2. migrations/001_caracteristicas_equipo.sql
#   3. migrations/002_serie_garantia_equipos.sql
#   4. migrations/003_idplantilla_caracteristicas.sql
npm run dev   # Desarrollo (puerto 3001)
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # Desarrollo (puerto 5173)
```

### Build producción
```bash
cd frontend
npm run build   # Genera dist/
```

---

## Convenciones de Código

- **Backend**: ES modules (`"type": "module"`), arquitectura 3 capas (routes → services → repositories)
- **Frontend**: Functional components + hooks, React Query para datos del servidor
- **BD**: Tablas con prefijo `Tab_EQ_`, PKs con nombre `Id[NombreTabla]`
- **Autenticación**: Token JWT en header `Authorization: Bearer <token>`
- **Roles**: `ADMIN` (todo), `TECNICO` (operaciones, sin sync ni cambios masivos)

---

## Componentes UI (shadcn + tailwind)

El frontend usa Tailwind CSS 4 con componentes shadcn/ui (`#components/ui/*.jsx`). Los componentes compartidos de dominio están en `src/components/`. Las páginas están en `src/pages/` y cada una se mapea a una ruta en `App.jsx`.
