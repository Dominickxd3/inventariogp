# 01 — Arquitectura

> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## Stack (verificado)

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, shadcn/ui, React Router 7 | — |
| Backend | Node.js 24, Express 4, ES Modules (`"type": "module"`) | — |
| Base de datos | SQL Server 2019+ con mssql driver | Pool vía `mssql.connect()` |
| Autenticación | JWT (jsonwebtoken), expiración 8h | — |
| QR | qrcode.react + html5-qrcode | — |
| Hash | **bcrypt** (no bcryptjs) | `"bcrypt": "^6.0.0"` |
| Validación | Zod (backend), HTML5 constraint + React state (frontend) | — |
| HTTP Client | **fetch() nativo** (no Axios) | `frontend/src/lib/api.js` |
| Acta de asignación | **HTML renderizado en backend** (no puppeteer) | `asignaciones.service.js` retorna HTML con estilo |

---

## Estructura de directorios (verificada)

```
/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.js          # Env vars (JWT_SECRET, SQL_*)
│   │   │   └── db.js             # Pool mssql (query/transaction/getConnection)
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT → req.usuario (no req.user)
│   │   │   ├── validate.js       # Zod → req.body (no req.parsedBody)
│   │   │   └── validators.js     # Schemas con zod
│   │   ├── routes/               # Express.Router() — ver lista abajo
│   │   ├── services/             # Lógica de negocio
│   │   ├── repositories/        # Acceso a base de datos (SQL parametrizado)
│   │   └── index.js             # Entry point (Express)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── lib/api.js           # Cliente fetch con JWT
│   │   ├── hooks/               # Custom hooks
│   │   ├── components/          # Componentes compartidos
│   │   └── pages/               # Páginas por ruta
│   ├── package.json
│   └── vite.config.js
├── docs/oficial/
├── ADR/
└── README.md
```

---

## Rutas del backend (verificadas contra código)

| Archivo | Prefijo |
|---------|---------|
| routes/auth.js | /api/auth/login |
| routes/equipos.js | /api/equipos |
| routes/trabajadores.js | /api/trabajadores |
| routes/asignaciones.js | /api/asignaciones |
| routes/incidencias.js | /api/incidencias |
| routes/componentes.js | /api/componentes |

**Nota**: No existen `/api/dashboard`, `/api/intervenciones`, ni `/api/mantenimiento`. Intervenciones se usan desde EquiposService sin ruta expuesta.

---

## Flujo de datos

```
Frontend                         Backend                        SQL Server
  │                                │                              │
  │  fetch() / JWT Bearer          │   query() / transaction()   │
  ├─────────────────────────────►  ├────────────────────────────►│
  │  ◄─────────────────────────────│  ◄───────────────────────────│
  │                                │                              │
  api.js añade automáticamente:    services llaman repositories:  Tab_EQ_Equipos
    - Content-Type: application/json  - getById(id)               Tab_EQ_Trabajadores
    - Authorization: Bearer <token>   - getAll(pagination)        Tab_EQ_Asignacion
                                       - create(data)             Tab_EQ_Componentes
                                       - update(id, data)         Tab_EQ_Accesorio
                                       - delete(id)               Tab_EQ_Incidencia
                                                                   Tab_EQ_EquipoComponente
                                                                   Tab_EQ_MovEquipoAsignacion
                                                                   Tab_EQ_MovAccesorio
                                                                   Tab_EQ_LoginAudit

```

---

## Convenciones backend (verificadas)

| Regla | Valor |
|-------|-------|
| Objeto usuario | `req.usuario` (⚠️ no `req.user`) |
| Body validado | `req.body` (⚠️ no `req.parsedBody`) |
| Hash | bcrypt (⚠️ no bcryptjs) |
| SQL Dinámico | **Prohibido**. Siempre `input('param', value)` |
| Transacciones | mssql transaction + BEGIN/COMMIT/ROLLBACK manual |
| Paginación SQL | `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY` |

---

## Convenciones frontend (verificadas)

| Regla | Valor |
|-------|-------|
| HTTP | fetch() nativo desde `lib/api.js` |
| Fetch personalizado | `api.get()`, `api.post()`, `api.put()`, `api.del()` |
| Errores | `catch (err) { toast.error(...) }` |
| Tablas server-side | Paginación remota con `@tanstack/react-table` |
| Debounce | 350ms en búsqueda server-side |
