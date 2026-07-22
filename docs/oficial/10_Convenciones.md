# 10 — Convenciones

> **Propósito**: Convenciones de código, estilo, nombres y organización del proyecto.
> **Estado**: ✅ Completo (extraído del código existente)

---

## 1. Backend — Node.js / Express

### 1.1 Estructura de archivos
```
routes/       → define rutas y conecta middleware → llama servicios
services/     → lógica de negocio, orquesta repositories
repositories/ → SQL directo con mssql (pool.query o transaction.request)
middleware/   → auth, validators, errorHandler
config/       → db.js, jwt.js, cors
```

### 1.2 Convenciones de código
- ES Modules (`import` / `export`)
- Nombres de archivos: **kebab-case.js** (ej: `asignaciones.service.js`, `auth.middleware.js`)
- Variables y funciones: **camelCase** (`crearAsignacion`, `obtenerEquipoPorId`)
- Constantes y enums: **UPPER_SNAKE_CASE** (`ESTADO_POR_MOTIVO`)
- Clases: **PascalCase** (aunque no se usan clases actualmente)
- Respuestas API: `{ data }` en éxito, `{ error, details?, code? }` en error
- Códigos de estado HTTP estándar (200, 201, 400, 401, 403, 404, 409, 500)

### 1.3 Transacciones BD
```javascript
const transaction = await pool.transaction();
try {
  await transaction.begin();
  // ... operaciones
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

### 1.4 Validación con Zod
- Esquemas definidos en `validators.js`
- Schema por operación: `{ body, params, query }`
- `req.parsedBody`, `req.parsedParams`, `req.parsedQuery`
- Error 400 con detalles del zod error

### 1.5 Autenticación
- Middleware `auth.verifyToken` → `req.user`
- Middleware `auth.requireRole(...)` → verifica rol
- JWT con payload: `{ IdUsuario, Usuario, Rol, Area }`, expira 8h

---

## 2. Frontend — React / Vite

### 2.1 Estructura de archivos
```
src/
  api/          → api.js (axios client), queryClient.js (react-query)
  components/   → ui/ (shadcn), DataTable, ErrorBoundary, modales compartidos
  pages/        → una carpeta plana por página/ruta
  providers/    → AuthProvider, ThemeProvider
```

### 2.2 Convenciones de código
- Archivos JSX: **PascalCase.jsx** (ej: `EquipoDetalle.jsx`, `DataTable.jsx`)
- Hooks: funciones con **use** prefix, en archivos separados o dentro del componente
- Tailwind CSS 4 con clases utilitarias (sin archivos CSS separados excepto casos especiales)
- CSS Modules o archivos .css separados solo cuando se requiere anular estilos de componentes

### 2.3 Componentes shadcn/ui
- Ubicados en `src/components/ui/`
- Prefijo consistente en clases: `cn()`
- Ref forwarding para componentes de formulario

### 2.4 Estado y data fetching
- react-query para toda comunicación con API
- `useQuery` para lecturas, con `queryKey` descriptivo
- `useMutation` para escrituras con `onSuccess`/`onError`
- `queryClient.invalidateQueries` para refrescar datos tras mutaciones

### 2.5 Routing
- React Router 7 en `App.jsx`
- Rutas anidadas bajo layout principal (`/`)
- Ruta pública solo para login (`/login`)
- Lazy loading de páginas cuando hay muchos módulos

### 2.6 Convenciones de UI
- `toast` para notificaciones (sonner)
- `Dialog` para formularios y confirmaciones (shadcn)
- `DataTable` para listas con soporte server-side y client-side
- `Button` con variantes `default`, `destructive`, `outline`, `ghost`
- `Badge` para estados con colores semánticos

---

## 3. Base de Datos — SQL Server

### 3.1 Nombres
- Tablas: **Prefijo_EQ_Nombre** (ej: `EQ_Equipos`, `EQ_Asignaciones`)
- Columnas: **PascalCase** con prefijo Id (ej: `IdEquipo`, `NombreTrabajador`)
- PK: `Id[NombreTabla]` (ej: `IdEquipo`, `IdAsignacion`)
- FK: mismo nombre que la columna referenciada
- Constraints: `PK_`, `FK_`, `UQ_`, `CK_`, `DF_` como prefijo
- Stored Procedures: **SP_** (ej: `SP_ActualizarDashboard`)

### 3.2 Tipos de dato
- IDs: `INT IDENTITY(1,1)`
- Texto corto: `VARCHAR(50)`, `VARCHAR(100)`, `VARCHAR(255)`
- Texto largo: `VARCHAR(500)`
- JSON: `NVARCHAR(MAX)`
- Fechas: `DATE` (solo fecha), `DATETIME` (fecha+hora)
- Booleanos: `BIT` (0/1)
- Flags de estado: `VARCHAR(20)` con CHECK constraint

---

## 4. API — REST

### 4.1 Nombres de endpoints
- **kebab-case** y **plural**
- Correcto: `/api/equipos`, `/api/asignaciones/cesar/:id`
- Incorrecto: `/api/getEquipos`, `/api/asignacionCesar`

### 4.2 Paginación
- Parámetros: `page` (1-indexed), `pageSize`
- Respuesta: `{ data: [], total, page, pageSize, totalPages }`
- Server-side para tablas grandes, client-side para datos pequeños

### 4.3 Búsqueda
- Parámetro `search` para búsqueda textual
- Filtros específicos como query params (`?tipo=LAPTOP&estado=DISPONIBLE`)

### 4.4 Fechas
- Formato ISO: `YYYY-MM-DD` para fechas, `YYYY-MM-DDTHH:mm:ss` para datetimes
- En BD: `GETDATE()` para defaults

### 4.5 Manejo de errores
- 400: validación fallida (Zod devuelve detalles)
- 401: no autenticado
- 403: rol insuficiente
- 404: recurso no encontrado
- 409: conflicto (duplicado, estado inválido para operación)
- 500: error interno (no exponer detalles en producción)

### 4.6 Versionado
- Actualmente sin versionado de API (todo bajo `/api/`)
- 💡 RECOMENDACIÓN: `/api/v1/` para futura evolución
