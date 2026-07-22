# 02 — Base de Datos

> **Propósito**: Modelo de datos del sistema.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## A. Tablas verificadas mediante código

Las siguientes tablas se confirman mediante consultas SQL en `backend/src/repositories/` y `backend/src/services/`.

| Tabla | Propósito | Mencionada en |
|-------|-----------|---------------|
| `Tab_SYS_Usuarios` | Usuarios del sistema | `usuarios.repository.js` |
| `Tab_SYS_LoginAudit` | Auditoría de inicios de sesión | `audit.repository.js` |
| `Tab_EQ_Trabajadores` | Directorio de empleados | `trabajadores.repository.js` |
| `Tab_EQ_MaeEquipos` | Activos tecnológicos | `equipos.repository.js` |
| `Tab_EQ_TipodeEquipos` | Catálogo de tipos de equipo | `equipos.repository.js` |
| `Tab_EQ_Componentes` | Repuestos y accesorios | `componentes.repository.js` |
| `Tab_EQ_TipodeComponentes` | Catálogo de tipos de componente | `componentes.repository.js` |
| `Tab_EQ_MovEquiposAsignaciones` | Asignaciones de equipos a trabajadores | `asignaciones.repository.js` |
| `Tab_EQ_MovAccesoriosTrabajador` | Accesorios vinculados a asignaciones | `asignaciones.service.js`, `componentes.repository.js` |
| `Tab_EQ_MovEquiposComponentes` | Componentes instalados en equipos | `componentes.repository.js` |
| `Tab_EQ_MovEstadosEquipos` | Historial de cambios de estado de equipos | `equipos.repository.js` |
| `Tab_EQ_Incidencias` | Reporte de incidencias | `incidencias.repository.js` |
| `Tab_EQ_IntervencionesTecnicas` | Intervenciones técnicas | `intervenciones.repository.js` |
| `Tab_EQ_IntervencionesComponentes` | Componentes usados en intervenciones | migración SQL |
| `Tab_EQ_ComponentesEventos` | Eventos de componentes | migración SQL |
| `Tab_EQ_CaracteristicasEquipo` | Características técnicas de equipos | `equipos.repository.js` |
| `Tab_EQ_PlantillaCaracteristicas` | Plantilla de características | `equipos.repository.js` |

### Notas sobre las tablas verificadas

- El sistema **no** tiene `Tab_EQ_Usuarios`; los usuarios están en `Tab_SYS_Usuarios`.
- `Tab_SYS_LoginAudit` registra intentos de login (User_Logon, Exitoso, DireccionIP, UserAgent, Mensaje).
- No se encontró evidencia de `Tab_EQ_Auditoria` genérica, `Tab_EQ_Dashboard`, `EQ_Notificaciones`, `EQ_Periodos` ni `EQ_IntervencionesProgramadas`.
- No se encontró evidencia de stored procedures (`SP_ActualizarDashboard`).

---

## B. Modelo conceptual pendiente de verificación contra BD real

> Las siguientes secciones describen un modelo **inferido** del código y la lógica de negocio. Las columnas, tipos, restricciones, FK, índices y CHECK constraints listados **no han sido verificados contra el esquema real de SQL Server**. Consultar las migraciones en `backend/migrations/` y `backend/create_core_tables.sql` para el DDL real.

### B.1 Convenciones generales

| Elemento | Convención observada en código |
|----------|-------------------------------|
| Prefijo de tablas | `Tab_EQ_` para módulo Equipos, `Tab_SYS_` para sistema |
| Columnas | PascalCase (ej: `IdMaeEquipo`, `NombreTrabajador`) |
| PK | `Id[NombreTabla]` o similar |
| Fechas | `DATE` (solo fecha), `DATETIME` (fecha+hora) |
| Booleanos | `BIT` (0/1) |
| Estados | `VARCHAR` con valores controlados |

### B.2 Estados observados

**Equipos (`Tab_EQ_MaeEquipos.Estado`):** `DISPONIBLE`, `ASIGNADO`, `MANTENIMIENTO`, `BAJA`, `RESGUARDADO`

**Asignaciones (`Tab_EQ_MovEquiposAsignaciones.Estado`):** `VIGENTE`, `CESADO`

**Movimientos de accesorios (`Tab_EQ_MovAccesoriosTrabajador.Estado`):** `VIGENTE`, `CESADO`

**Componentes (`Tab_EQ_Componentes.Estado`):** `DISPONIBLE`, `ASIGNADO`, `INSTALADO`, `MANTENIMIENTO`, `BAJA`

**Incidencias (`Tab_EQ_Incidencias.Estado`):** `ABIERTO`, `EN_PROCESO`, `CERRADO`

**Usuarios (`Tab_SYS_Usuarios.Rol`):** `ADMIN`, `TECNICO`

### B.3 Relaciones principales inferidas

```
Tab_SYS_Usuarios (IdUsuario)
  └─ Tab_EQ_Trabajadores (IdTrabajador) — posible FK desde usuarios a trabajadores

Tab_EQ_Trabajadores (IdTrabajador)
  └─ Tab_EQ_MovEquiposAsignaciones (IdReferente) — trabajador asignado

Tab_EQ_MaeEquipos (IdMaeEquipo)
  ├─ Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo) — equipo asignado
  ├─ Tab_EQ_MovEquiposComponentes (IdMaeEquipo) — componentes instalados
  ├─ Tab_EQ_MovEstadosEquipos (IdMaeEquipo) — historial de estados
  └─ Tab_EQ_Incidencias (IdMaeEquipo) — incidencias reportadas

Tab_EQ_Componentes (IdComponente)
  ├─ Tab_EQ_MovAccesoriosTrabajador (IdComponente) — accesorio asignado
  └─ Tab_EQ_MovEquiposComponentes (IdComponente) — componente instalado

Tab_EQ_TipodeEquipos (IdTipodeEquipo) → Tab_EQ_MaeEquipos (IdTipodeEquipo)
Tab_EQ_TipodeComponentes (IdTipodeComponente) → Tab_EQ_Componentes (IdTipodeComponente)
```

---

## C. Hallazgos

| # | Hallazgo | Severidad | Evidencia |
|---|----------|-----------|-----------|
| 1 | Los nombres reales de tablas (`Tab_EQ_MaeEquipos`, `Tab_EQ_MovEquiposAsignaciones`, etc.) difieren del modelo conceptual `EQ_Equipos`, `EQ_Asignaciones` | 🔴 Alta | Código en repositorios |
| 2 | Usuarios viven en `Tab_SYS_Usuarios`, no en `Tab_EQ_Usuarios` | 🟡 Media | `usuarios.repository.js` |
| 3 | No existe `Tab_EQ_Auditoria` genérica; solo `Tab_SYS_LoginAudit` para logins | 🟡 Media | Búsqueda en código |
| 4 | No existe `Tab_EQ_Dashboard` ni `SP_ActualizarDashboard` documentado | 🟡 Media | No encontrado en código |
| 5 | No se verificaron CHECK constraints, FK, índices ni tipos de columna contra la BD real | 🔴 Alta | No se ejecutó sp_help/INFORMATION_SCHEMA |
