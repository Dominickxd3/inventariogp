# 09 — Roles y Permisos

> **Propósito**: Matriz de roles del sistema y permisos por endpoint.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## 1. Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso completo a todas las funcionalidades del sistema |
| `TECNICO` | Operaciones diarias de inventario, asignaciones e intervenciones |

## 2. Matriz de permisos

### 2.1 Auth

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/auth/login` | POST | ✅ | ✅ |

### 2.2 Equipos

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/equipos` | GET | ✅ | ✅ |
| `/api/equipos` | POST | ✅ | ❌ |
| `/api/equipos/:id` | GET | ✅ | ✅ |
| `/api/equipos/:id` | PUT | ✅ | ✅ |
| `/api/equipos/baja/:id` | POST | ✅ | ❌ |
| `/api/equipos/importar` | POST | ✅ | ❌ |

### 2.3 Trabajadores

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/trabajadores` | GET | ✅ | ✅ |
| `/api/trabajadores` | POST | ✅ | ❌ |
| `/api/trabajadores/:id` | PUT | ✅ | ✅ |
| `/api/trabajadores/stats` | GET | ✅ | ✅ |
| `/api/trabajadores/search` | GET | ✅ | ✅ |

### 2.4 Asignaciones

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/asignaciones` | GET | ✅ | ✅ |
| `/api/asignaciones` | POST | ✅ | ✅ |
| `/api/asignaciones/cesar/:id` | POST | ✅ | ✅ |
| `/api/asignaciones/activas/:id` | GET | ✅ | ✅ |

### 2.5 Componentes

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/componentes` | GET | ✅ | ✅ |
| `/api/componentes` | POST | ✅ | ❌ |
| `/api/componentes/:id` | PUT | ✅ | ✅ |

### 2.6 Incidencias

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/incidencias` | GET | ✅ | ✅ |
| `/api/incidencias` | POST | ✅ | ✅ |
| `/api/incidencias/:id` | PUT | ✅ | ✅ |
| `/api/incidencias/:id` | GET | ✅ | ✅ |

### 2.7 Intervenciones

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/intervenciones` | GET | ✅ | ✅ |
| `/api/intervenciones` | POST | ✅ | ✅ |
| `/api/intervenciones/:id` | PUT | ✅ | ✅ |
| `/api/intervenciones/:id` | GET | ✅ | ✅ |

### 2.8 Sistema

| Ruta | Método | ADMIN | TECNICO |
|------|--------|-------|---------|
| `/api/usuarios` | GET | ✅ | ❌ |
| `/api/usuarios` | POST | ✅ | ❌ |
| `/api/usuarios/:id` | PUT | ✅ | ❌ |
| `/api/dashboard` | GET | ✅ | ✅ |
| `/api/mantenimiento/*` | POST | ✅ | ❌ |

## 3. Resumen

| Capacidad | ADMIN | TECNICO |
|-----------|-------|---------|
| Ver inventario | ✅ | ✅ |
| Crear/editar equipos | ✅ | ❌ / ✅ (editar) |
| Asignar/cesar equipos | ✅ | ✅ |
| Gestionar incidencias | ✅ | ✅ |
| Gestionar intervenciones | ✅ | ✅ |
| Gestionar usuarios | ✅ | ❌ |
| Importar/exportar datos | ✅ | ❌ |
| Dar de baja activos | ✅ | ❌ |
| Dashboard | ✅ | ✅ |

## 4. Implementación

El middleware de autorización está en `backend/src/middleware/auth.js`:

```javascript
// Ejemplo: solo ADMIN
router.post('/', auth.verifyToken, auth.requireRole('ADMIN'), equipoController.crear);

// Ejemplo: ADMIN o TECNICO
router.get('/', auth.verifyToken, auth.requireRole('ADMIN', 'TECNICO'), equipoController.listar);
```
