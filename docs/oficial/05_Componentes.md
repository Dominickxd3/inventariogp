# 05 — Componentes

> **Propósito**: Documentación del módulo de Componentes — repuestos, accesorios y su ciclo de vida en el sistema.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## 1. ¿Qué es un componente?

En InventarioGP, **Componente** es un término genérico que abarca dos categorías con comportamientos distintos:

| Categoría | Ejemplos | Tipo de gestión |
|-----------|----------|----------------|
| **Repuesto interno** | RAM, SSD, HDD, batería, fuente de poder, placa madre | Se instala dentro de un equipo (pasa a `INSTALADO`) |
| **Accesorio externo** | Teclado, mouse, cargador, monitor externo, hub | Se asigna junto a un equipo (pasa a `ASIGNADO`) |

## 2. Estados de componente

| Estado | Significado |
|--------|-------------|
| `DISPONIBLE` | En almacén, listo para usar |
| `INSTALADO` | Instalado físicamente dentro de un equipo |
| `ASIGNADO` | Asignado como accesorio a un trabajador vía asignación de equipo |
| `MANTENIMIENTO` | En reparación o revisión |
| `BAJA` | Desechado, perdido o dado de baja |

### Transiciones permitidas

```
DISPONIBLE → INSTALADO   (vía intervención, instalar en equipo)
DISPONIBLE → ASIGNADO    (vía asignación, como accesorio)
DISPONIBLE → MANTENIMIENTO  (vía intervención, enviar a reparar)
DISPONIBLE → BAJA        (vía baja directa)

INSTALADO → DISPONIBLE   (vía intervención, retirar del equipo)
INSTALADO → MANTENIMIENTO  (vía intervención, falla detectada)
INSTALADO → BAJA         (vía baja, componente dañado irrecuperable)

ASIGNADO → DISPONIBLE    (vía cese de asignación)
ASIGNADO → BAJA          (vía baja directa)

MANTENIMIENTO → DISPONIBLE  (vía intervención, reparado)
MANTENIMIENTO → BAJA     (vía baja, no reparable)
```

## 3. Arquitectura P0 — Tablas

### 3.1 `EQ_Componentes` (modificada)

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
| IdCreadoPor | INT | NOT NULL, FK → EQ_Usuarios(IdUsuario) |
| FechaCreacion | DATETIME | NOT NULL, DEFAULT GETDATE() |
| IdUsuarioBaja | INT | NULL, FK → EQ_Usuarios(IdUsuario) |
| FechaBaja | DATETIME | NULL |
| MotivoBaja | VARCHAR(200) | NULL |
| DisposicionFinal | VARCHAR(100) | NULL |
| RowVersion | ROWVERSION | NOT NULL |
| IdEquipoActual | INT | NULL, FK → EQ_Equipos(IdEquipo) — equipo donde está instalado |

### 3.2 `EQ_ComponentesEventos` (nueva)

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdEvento | INT | PK, IDENTITY(1,1) |
| IdComponente | INT | NOT NULL, FK → EQ_Componentes(IdComponente) |
| EstadoAnterior | VARCHAR(20) | NULL |
| EstadoNuevo | VARCHAR(20) | NOT NULL |
| IdUsuario | INT | NOT NULL, FK → EQ_Usuarios(IdUsuario) |
| FechaEvento | DATETIME | NOT NULL, DEFAULT GETDATE() |
| Motivo | VARCHAR(200) | NULL |
| IdReferencia | INT | NULL — ID de la asignación, intervención o incidencia relacionada |
| TablaReferencia | VARCHAR(50) | NULL — 'EQ_Asignaciones', 'EQ_Intervenciones', etc. |
| Detalle | NVARCHAR(MAX) | NULL — JSON con contexto adicional |

**Índices**:
- `IX_ComponentesEventos_IdComponente` ON IdComponente
- `IX_ComponentesEventos_Fecha` ON FechaEvento DESC
- `IX_ComponentesEventos_EstadoNuevo` ON EstadoNuevo

### 3.3 `EQ_EquiposComponentes` (modificada)

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdEquipoComponente | INT | PK, IDENTITY(1,1) |
| IdEquipo | INT | NOT NULL, FK → EQ_Equipos(IdEquipo) |
| IdComponente | INT | NOT NULL, FK → EQ_Componentes(IdComponente), UNIQUE |
| EstadoRelacion | VARCHAR(20) | NOT NULL, CHECK (EstadoRelacion IN ('INSTALADO','RETIRADO','REEMPLAZADO')) |
| FechaInstalacion | DATETIME | NOT NULL, DEFAULT GETDATE() |
| FechaRetiro | DATETIME | NULL |
| IdIntervencionInstalacion | INT | NULL, FK → EQ_Intervenciones(IdIntervencion) |
| IdIntervencionRetiro | INT | NULL, FK → EQ_Intervenciones(IdIntervencion) |
| RowVersion | ROWVERSION | NOT NULL |

### 3.4 `EQ_IntervencionesComponentes` (nueva — separada)

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdIntervencionComp | INT | PK, IDENTITY(1,1) |
| IdIntervencion | INT | NOT NULL, FK → EQ_Intervenciones(IdIntervencion) |
| IdComponente | INT | NOT NULL, FK → EQ_Componentes(IdComponente) |
| Accion | VARCHAR(20) | NOT NULL, CHECK (Accion IN ('INSTALAR','RETIRAR','REEMPLAZAR','REVISAR','REPARAR')) |
| Observacion | VARCHAR(500) | NULL |
| FechaRegistro | DATETIME | NOT NULL, DEFAULT GETDATE() |

**Índices**:
- `IX_IntervencionesComponentes_IdIntervencion` ON IdIntervencion
- `IX_IntervencionesComponentes_IdComponente` ON IdComponente

### 3.5 `EQ_AsignacionesAcc` (modificada)

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| IdAsignacionAcc | INT | PK, IDENTITY(1,1) |
| IdAsignacion | INT | NOT NULL, FK → EQ_Asignaciones(IdAsignacion) |
| IdComponente | INT | NOT NULL, FK → EQ_Componentes(IdComponente) |
| Accion | VARCHAR(20) | NOT NULL, CHECK (Accion IN ('ASIGNADO','INSTALADO')) |
| FechaRegistro | DATETIME | NOT NULL, DEFAULT GETDATE() |
| IdEstadoAnterior | VARCHAR(20) | NULL — estado del componente antes de la asignación |

## 4. API endpoints P0

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/componentes` | Lista paginada y filtrada (incluye ubicación actual, RowVersion) |
| POST | `/api/componentes` | Crear componente (con transacción + evento CREACION) |
| PUT | `/api/componentes/:id` | Actualizar (valida RowVersion, 409 si conflict) |
| GET | `/api/componentes/:id` | Detalle completo con ubicación actual, timeline de eventos |
| POST | `/api/componentes/:id/timeline` | Obtener historial de eventos ordenado por fecha |
| POST | `/api/componentes/baja/:id` | Baja completa con motivo+fecha+usuario+disposición final (valida RowVersion) |

### Validación de transiciones

Middleware/validador que rechaza cambios de estado no permitidos según la matriz del punto 2, devolviendo 409 con mensaje descriptivo.

### Bloqueo transaccional

Cada operación crítica sigue el patrón:
```
BEGIN TRAN
  LOCK (SELECT... WITH (UPDLOCK, ROWLOCK) para evitar deadlocks)
  VALIDAR (estado actual vs. transición permitida, RowVersion)
  ACTUALIZAR (componente + estados relacionados)
  AUDITAR (insertar en EQ_ComponentesEventos)
COMMIT
```

## 5. Frontend P0

### Vista Detalle (`/componentes/:id`)
- Datos generales del componente
- **Ubicación actual**: si está INSTALADO, mostrar equipo; si ASIGNADO, mostrar trabajador; si DISPONIBLE, mostrar "Almacén"
- **Timeline**: lista cronológica de eventos (creación, instalaciones, retiros, asignaciones, mantenimientos, bajas)
- **Acciones permitidas**: botones contextuales según estado actual (Baja si no está en BAJA, etc.)

### Wizard de creación
- Paso 1: datos generales (tipo, marca, modelo, serie)
- Paso 2: opcional — asignar directamente a equipo (pasa a INSTALADO) o a trabajador (pasa a ASIGNADO)

## 6. Problemas que resuelve el refactor

| # | Problema | Solución |
|---|----------|----------|
| 1 | Componentes no cambian estado al asignarse como accesorios | `EQ_AsignacionesAcc` ahora registra estado anterior y dispara cambio |
| 2 | Sin trazabilidad de movimientos | `EQ_ComponentesEventos` captura cada cambio de estado con timestamp |
| 3 | Intervenciones limitadas a 1+1 | `EQ_IntervencionesComponentes` permite N componentes con 5 acciones |
| 4 | Estado `ASIGNADO` sin uso | Activado: accesorio asignado → estado ASIGNADO |
| 5 | Baja sin motivo/usuario/fecha | Nuevos campos + evento obligatorio |
| 6 | Sin control de concurrencia | RowVersion + 409 en actualizaciones |
| 7 | Sin transacciones completas | Patrón BEGIN/LOCK/VALIDAR/ACTUALIZAR/AUDITAR/COMMIT |
