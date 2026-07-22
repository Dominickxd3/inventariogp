# 02 — Base de Datos

> **Propósito**: Documento de referencia del modelo de datos completo, esquema, tablas, columnas, restricciones, índices y relaciones.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN
> **Nota**: No modificar la base de datos sin autorización expresa del usuario.

---

## 1. Configuración de la base de datos

- **BD**: `InventarioGP`
- **Motor**: Microsoft SQL Server 2019+
- **Autenticación**: SQL Server Auth (usuario `sa` en desarrollo)
- **Esquema por defecto**: `dbo`

> ⚠️ **Correcciones verificadas respecto a código**:
> - Los nombres reales de tablas usan prefijo `Tab_EQ_` (ej: `Tab_EQ_Trabajadores`, `Tab_EQ_MaeEquipos`, `Tab_EQ_MovEquiposAsignaciones`). Las estructuras de columnas listadas abajo son **inferidas** del modelo conceptual, no verificadas contra la BD real. Consultar los repositorios en `backend/src/repositories/` para la nomenclatura exacta de tablas y columnas.
> - `bcryptjs` → `bcrypt` (verificado en `backend/package.json`)

## 2. Tablas del sistema

### 2.1 `EQ_Usuarios` — Usuarios del sistema

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdUsuario | INT | PK, IDENTITY(1,1) |
| Usuario | VARCHAR(100) | NOT NULL, UNIQUE |
| Password | VARCHAR(255) | NOT NULL |
| Rol | VARCHAR(20) | NOT NULL, CHECK (Rol IN ('ADMIN','TECNICO')) |
| IdTrabajador | INT | FK → EQ_Trabajadores(IdTrabajador), NOT NULL, UNIQUE |
| UltimoAcceso | DATETIME | NULL |
| CreadoPor | INT | FK → EQ_Usuarios(IdUsuario), NOT NULL |
| FechaCreacion | DATETIME | NOT NULL, DEFAULT GETDATE() |
| Activo | BIT | NOT NULL, DEFAULT 1 |

### 2.2 `EQ_Trabajadores` — Directorio de empleados

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdTrabajador | INT | PK, IDENTITY(1,1) |
| DNI | VARCHAR(20) | NOT NULL, UNIQUE |
| Nombres | VARCHAR(100) | NOT NULL |
| Cargo | VARCHAR(100) | NOT NULL |
| Area | VARCHAR(100) | NULL |
| Correo | VARCHAR(100) | NULL |
| Celular | VARCHAR(20) | NULL |
| Sede | VARCHAR(100) | NULL |
| Activo | BIT | NOT NULL, DEFAULT 1 |
| FechaCreacion | DATETIME | NOT NULL, DEFAULT GETDATE() |

**🔍 INFERENCIA**: La columna `Area` no tiene FK a un catálogo de áreas. Los valores se repiten libremente.

### 2.3 `EQ_Equipos` — Activos tecnológicos

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdEquipo | INT | PK, IDENTITY(1,1) |
| TipoEquipo | VARCHAR(50) | NOT NULL |
| Marca | VARCHAR(50) | NULL |
| Modelo | VARCHAR(100) | NULL |
| NumeroSerie | VARCHAR(100) | NULL, UNIQUE |
| CodigoInterno | VARCHAR(50) | NULL, UNIQUE |
| CodigoPatrimonial | VARCHAR(50) | NULL |
| Caracteristicas | VARCHAR(500) | NULL |
| Estado | VARCHAR(20) | NOT NULL, CHECK (Estado IN ('DISPONIBLE','ASIGNADO','MANTENIMIENTO','BAJA','RESGUARDADO')) |
| FechaIngreso | DATE | NOT NULL |
| FechaBaja | DATE | NULL |
| IdTrabajador | INT | NULL, FK → EQ_Trabajadores(IdTrabajador) |
| IdCreadoPor | INT | NULL (debería FK → EQ_Usuarios) |
| FechaCreacion | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Hallazgos**:
- ❌ `FechaBaja` no se usa (el sistema usa `FechaFin` en asignaciones).
- ❌ `IdTrabajador` en Equipos es redundante con la asignación activa; no siempre se actualiza.

### 2.4 `EQ_Componentes` — Repuestos y accesorios en almacén

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdComponente | INT | PK, IDENTITY(1,1) |
| TipoComponente | VARCHAR(50) | NOT NULL |
| Marca | VARCHAR(50) | NULL |
| Modelo | VARCHAR(100) | NULL |
| NumeroSerie | VARCHAR(100) | NULL, UNIQUE |
| Estado | VARCHAR(20) | NOT NULL, CHECK (Estado IN ('DISPONIBLE','INSTALADO','ASIGNADO','MANTENIMIENTO','BAJA')) |
| Ubicacion | VARCHAR(100) | NULL |
| Observaciones | VARCHAR(500) | NULL |
| IdCreadoPor | INT | FK → EQ_Usuarios(IdUsuario) |
| FechaCreacion | DATETIME | NOT NULL, DEFAULT GETDATE() |

### 2.5 `EQ_Asignaciones` — Asignaciones de equipos

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdAsignacion | INT | PK, IDENTITY(1,1) |
| IdEquipo | INT | NOT NULL, FK → EQ_Equipos(IdEquipo) |
| IdTrabajador | INT | NOT NULL, FK → EQ_Trabajadores(IdTrabajador) |
| FechaAsignacion | DATE | NOT NULL |
| FechaFin | DATE | NULL |
| Estado | VARCHAR(20) | NOT NULL, CHECK (Estado IN ('VIGENTE','CESADA')) |
| MotivoCese | VARCHAR(100) | NULL |
| Obs | VARCHAR(500) | NULL |
| IdCreadoPor | INT | FK → EQ_Usuarios(IdUsuario), NOT NULL |
| FechaCreacion | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Reglas**:
- Un equipo solo puede tener una asignación `VIGENTE` a la vez.
- `MotivoCese` usa 9 valores controlados (ver catálogo de estados).
- `IdCreadoPor` es quien registró la asignación (no necesariamente el técnico que la realizó).

### 2.6 `EQ_AsignacionesAcc` — Accesorios ligados a asignaciones

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdAsignacionAcc | INT | PK, IDENTITY(1,1) |
| IdAsignacion | INT | NOT NULL, FK → EQ_Asignaciones(IdAsignacion) |
| IdComponente | INT | NOT NULL, FK → EQ_Componentes(IdComponente) |
| Accion | VARCHAR(20) | NOT NULL, CHECK (Accion IN ('ASIGNADO','INSTALADO')) |
| FechaRegistro | DATETIME | NOT NULL, DEFAULT GETDATE() |

### 2.7 `EQ_EquiposComponentes` — Componentes instalados en equipos

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdEquipoComponente | INT | PK, IDENTITY(1,1) |
| IdEquipo | INT | NOT NULL, FK → EQ_Equipos(IdEquipo) |
| IdComponente | INT | NOT NULL, FK → EQ_Componentes(IdComponente), UNIQUE |
| EstadoRelacion | VARCHAR(20) | NOT NULL, CHECK (EstadoRelacion IN ('INSTALADO','RETIRADO','REEMPLAZADO')) |
| FechaInstalacion | DATETIME | NOT NULL, DEFAULT GETDATE() |
| FechaRetiro | DATETIME | NULL |

### 2.8 `EQ_Incidencias` — Reporte de incidencias

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdIncidencia | INT | PK, IDENTITY(1,1) |
| IdEquipo | INT | NOT NULL, FK → EQ_Equipos(IdEquipo) |
| Descripcion | VARCHAR(500) | NOT NULL |
| TipoIncidencia | VARCHAR(50) | NOT NULL |
| Prioridad | VARCHAR(20) | NOT NULL, CHECK (Prioridad IN ('BAJA','MEDIA','ALTA','CRITICA')) |
| Estado | VARCHAR(20) | NOT NULL, CHECK (Estado IN ('ABIERTO','EN_PROCESO','CERRADO')) |
| IdReportadoPor | INT | FK → EQ_Trabajadores(IdTrabajador) |
| IdCreadoPor | INT | FK → EQ_Usuarios(IdUsuario) |
| FechaCreacion | DATETIME | NOT NULL, DEFAULT GETDATE() |

### 2.9 `EQ_Intervenciones` — Intervenciones técnicas

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdIntervencion | INT | PK, IDENTITY(1,1) |
| IdIncidencia | INT | NULL, FK → EQ_Incidencias(IdIncidencia) |
| IdEquipo | INT | NOT NULL, FK → EQ_Equipos(IdEquipo) |
| TipoIntervencion | VARCHAR(50) | NOT NULL |
| Descripcion | VARCHAR(500) | NOT NULL |
| Resultado | VARCHAR(20) | NOT NULL, CHECK (Resultado IN ('EXITOSO','PARCIAL','FALLIDO')) |
| FechaInicio | DATETIME | NOT NULL, DEFAULT GETDATE() |
| FechaFin | DATETIME | NULL |
| IdCreadoPor | INT | FK → EQ_Usuarios(IdUsuario) |

### 2.10 `EQ_IntervencionesComponentes` — Componentes usados en intervención

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdIntervencionComp | INT | PK, IDENTITY(1,1) |
| IdIntervencion | INT | NOT NULL, FK → EQ_Intervenciones(IdIntervencion) |
| IdComponente | INT | NOT NULL, FK → EQ_Componentes(IdComponente) |
| Accion | VARCHAR(20) | NOT NULL, CHECK (Accion IN ('INSTALAR','RETIRAR','REEMPLAZAR')) |

### 2.11 `EQ_Dashboard` — Vistas materializadas para el dashboard

Tabla poblada por el stored procedure `SP_ActualizarDashboard`.

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| Id | INT | PK, IDENTITY(1,1) |
| Indicador | VARCHAR(100) | NOT NULL, UNIQUE |
| Valor | INT | NOT NULL |
| FechaActualizacion | DATETIME | NOT NULL, DEFAULT GETDATE() |

### 2.12 `EQ_Auditoria` — Log de operaciones

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdAuditoria | INT | PK, IDENTITY(1,1) |
| Tabla | VARCHAR(100) | NOT NULL |
| Operacion | VARCHAR(20) | NOT NULL |
| IdRegistro | INT | NOT NULL |
| ValoresAnteriores | NVARCHAR(MAX) | NULL (JSON) |
| ValoresNuevos | NVARCHAR(MAX) | NULL (JSON) |
| IdUsuario | INT | NOT NULL, FK → EQ_Usuarios(IdUsuario) |
| Fecha | DATETIME | NOT NULL, DEFAULT GETDATE() |

### 2.13 `EQ_LoginAudit` — Auditoría de inicios de sesión

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdLoginAudit | INT | PK, IDENTITY(1,1) |
| IdUsuario | INT | NULL, FK → EQ_Usuarios(IdUsuario) |
| Usuario | VARCHAR(100) | NOT NULL |
| Exitoso | BIT | NOT NULL |
| DireccionIP | VARCHAR(50) | NULL |
| Fecha | DATETIME | NOT NULL, DEFAULT GETDATE() |

### 2.14 `EQ_Notificaciones` (pendiente de implementación)

Tabla creada pero sin uso actual.

### 2.15 `EQ_Periodos` — Períodos de intervenciones periódicas

### 2.16 `EQ_IntervencionesProgramadas` — Programación de intervenciones

## 3. Índices identificados

- PKs por defecto en todas las tablas (clustered sobre Id)
- FK implícitas referenciadas en consultas frecuentes: `IdEquipo`, `IdTrabajador`, `IdComponente`, `IdAsignacion`
- 🔍 INFERENCIA: Es probable que falten índices no-clustered en columnas de filtrado frecuente como `EQ_Equipos.Estado`, `EQ_Asignaciones.Estado`, `EQ_Componentes.Estado`

## 4. Hallazgos y observaciones

| # | Hallazgo | Severidad |
|---|----------|-----------|
| 1 | `EQ_Equipos.FechaBaja` no se usa | 🟡 Media |
| 2 | `EQ_Equipos.IdTrabajador` es redundante con asignación activa | 🟡 Media |
| 3 | No hay CHECK que valide `EQ_Equipos.Estado` contra el catálogo real | 🔴 Alta |
| 4 | `EQ_Componentes.Estado` permite `ASIGNADO` que no tiene sentido sin asignaciones | 🔴 Alta |
| 5 | No hay tabla de `TipoEquipo` como catálogo — se usa VARCHAR libre | 🟡 Media |
| 6 | No hay trigger/logging de cambios de estado en tablas principales | 🟡 Media |
| 7 | `Tab_EQ_Usuarios.Password` usa bcrypt (hash, no plain text) al menos | ✅ Correcto |
