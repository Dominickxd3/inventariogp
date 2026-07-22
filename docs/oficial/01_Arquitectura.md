# 01 — Arquitectura

> **Propósito**: Describe la arquitectura general del sistema, estructura de capas, flujo de datos y decisiones técnicas.
> **Estado**: ✅ Completo

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, shadcn/ui, React Router 7, @tanstack/react-query 5, @tanstack/react-table 8 |
| Backend | Node.js 24, Express 4, ES Modules (`"type": "module"`) |
| Base de datos | SQL Server 2019+ con mssql driver |
| Autenticación | JWT (jsonwebtoken) con expiración 8h |
| QR | qrcode.react (generación) + html5-qrcode (lectura) |
| PDF | puppeteer (acta de asignación) |
| Hash BCrypt | bcryptjs (contraseñas) |
| Validación | Zod (backend), HTML5 constraint validation + React state (frontend) |

## Estructura de directorios

```
/
├── backend/
│   ├── src/
│   │   ├── config/            # db.js, jwt.js, cors.js
│   │   ├── middleware/         # auth.js, validators.js, errorHandler.js
│   │   ├── routes/            # Express routers por módulo
│   │   ├── services/          # Lógica de negocio
│   │   └── repositories/      # Consultas SQL directas con mssql
│   ├── .env                   # Puerto, conexión BD, JWT secret
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/               # api.js (cliente axios), queryClient.js
│   │   ├── components/        # Componentes compartidos (ui/, DataTable, layout)
│   │   ├── pages/             # Páginas del router por módulo
│   │   ├── providers/         # AuthProvider, ThemeProvider
│   │   ├── App.jsx            # Router principal
│   │   └── main.jsx           # Entry point con providers
│   └── package.json
│
└── docs/
    ├── oficial/               # Documentación oficial del proyecto
    └── modulo-componentes-especificacion.md
```

## Capas del backend

```
HTTP Request
    │
    ▼
Middleware (JWT → role check)
    │
    ▼
Route → valida con Zod
    │
    ▼
Service → lógica de negocio, orquesta repositories
    │
    ▼
Repository → SQL directo con mssql
    │
    ▼
SQL Server
```

### Middleware chain
1. **auth.js** — verifica JWT (`req.user = { IdUsuario, Usuario, Rol, Area }`)
2. **validators.js** — esquemas Zod por operación → `req.parsedBody` y `req.parsedParams`
3. **errorHandler.js** — captura errores globales, devuelve `{ error, details?, code? }` con status code adecuado

### Convenciones
- Servicios inician transacción con `transaction.begin()` para operaciones multi-tabla
- Repositorios reciben `pool` o `transaction` y ejecutan `request()`
- Nombres: `controllers` no existe — rutas llaman servicios directamente

## Frontend layers

```
Pages → usan hooks de react-query
  │
  ▼
Components → DataTable, Cards, Dialogs, Forms
  │
  ▼
api/api.js → axios instance con interceptor JWT
  │
  ▼
Backend API
```

### Patrones
- `useQuery` / `useMutation` de react-query para toda data fetching
- Callbacks `onSuccess`/`onError` en mutations para notificaciones toast
- Componentes de ui/ de shadcn: Button, Dialog, Select, Input, Textarea, etc.

## Frontend routing

```
/login               → Login.jsx (no requiere auth)
/                     → Layout con Sidebar
  /equipos            → Equipos.jsx (lista con DataTable)
  /equipos/:id        → EquipoDetalle.jsx
  /equipos/nuevo      → EquipoForm.jsx
  /equipos/editar/:id → EquipoForm.jsx
  /equipos/scan/:codigo → EquipoScan.jsx
  /trabajadores       → Trabajadores.jsx
  /asignaciones       → Asignaciones.jsx
  /incidencias        → Incidencias.jsx
  /incidencias/:id    → IncidenciaDetalle.jsx
  /intervenciones     → Intervenciones.jsx
  /componentes        → Componentes.jsx
  /dashboard          → Dashboard.jsx
  /mantenimiento      → Mantenimiento.jsx
```

## Flujo de datos típico (ej: asignar equipo)

```
1. Usuario completa formulario y hace clic en "Asignar"
2. Componente llama api.asignaciones.crear(equipoSeleccionado, trabajadorId, accesorios[])
3. Backend route recibe POST /api/asignaciones
4. Validator Zod rechaza datos inválidos (400)
5. Service inicia transacción:
   a. Inserta en EQ_Asignaciones (Estado='VIGENTE')
   b. Actualiza EQ_Equipos.Estado ASIGNADO
   c. Inserta accesorios en EQ_AsignacionesAcc
   d. Commit
6. Repository ejecuta SQL con parámetros
7. Success → toast verde, refetch queries
```
