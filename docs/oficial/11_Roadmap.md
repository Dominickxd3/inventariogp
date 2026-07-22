# 11 — Roadmap

> **Propósito**: Roadmap completo del proyecto con prioridades P0–P3 definidas por el usuario.
> **Estado**: ✅ Aprobado por el usuario

---

## Prioridad P0 — Obligatorio antes de considerar el sistema maduro

### 1. Refactor completo del módulo Componentes ⭐⭐⭐⭐⭐

**Backend**
- CRUD adaptado con nuevos estados y validaciones
- Validación de transiciones de estado (matriz de 5 estados)
- Bloqueos transaccionales (BEGIN/LOCK/VALIDAR/AUDITAR/COMMIT)
- RowVersion para control de concurrencia
- Auditoría completa vía EQ_ComponentesEventos
- Timeline de eventos por componente

**Base de Datos**
- ✅ `EQ_Componentes` — modificar: agregar IdUsuarioBaja, FechaBaja, MotivoBaja, DisposicionFinal, RowVersion, IdEquipoActual
- ✅ `EQ_ComponentesEventos` — crear tabla de trazabilidad
- ✅ `EQ_IntervencionesComponentes` — crear tabla separada multi-acción
- ✅ `EQ_EquiposComponentes` — modificar: agregar IdIntervencionInstalacion, IdIntervencionRetiro, RowVersion
- ✅ `EQ_AsignacionesAcc` — modificar: agregar IdEstadoAnterior
- Agregar índices, CHECK constraints, UNIQUE constraints

**Frontend**
- Detalle completo con timeline, historial, ubicación actual, acciones permitidas
- Wizard de creación (paso 1: datos; paso 2: asignación directa a equipo/trabajador)

### 2. Intervenciones Multi-Componente ⭐⭐⭐⭐⭐

| Estado actual | Estado destino |
|--------------|----------------|
| 1 instalado + 1 retirado | N instalados, N retirados, N revisados, N reparados |

**Modificar:**
- Frontend: formulario con selectores multi por tipo de acción
- Backend: arrays en body, procesamiento transaccional
- BD: nueva tabla `EQ_IntervencionesComponentes` con acciones ampliadas
- Validadores: Zod schemas con arrays
- API: nuevo contrato POST/PUT

### 3. Trazabilidad completa ⭐⭐⭐⭐⭐

Registrar todo cambio de estado en `EQ_ComponentesEventos`:

```
CREACIÓN → EDICIÓN → ASIGNACIÓN → RETIRO → INSTALACIÓN → MANTENIMIENTO → BAJA
```

Cada evento captura: estado anterior, estado nuevo, usuario, fecha, motivo, referencia (asignación/intervención relacionada), detalle en JSON.

### 4. Baja completa ⭐⭐⭐⭐⭐

Actualmente falta:
- Motivo de baja
- Usuario que dio de baja
- Fecha de baja
- Disposición final (RECICLAJE, DONACIÓN, DESECHO, ALMACENADO)
- Auditoría del evento
- Validaciones: no dar de baja si está ASIGNADO o INSTALADO

### 5. Concurrencia ⭐⭐⭐⭐

- Agregar `RowVersion` a tablas críticas (EQ_Componentes, EQ_Equipos, EQ_Asignaciones, EQ_EquiposComponentes)
- Actualizar API: PUT recibe RowVersion en body
- HTTP 409 si RowVersion no coincide
- Optimistic Lock: reintentar con datos frescos o notificar al usuario

### 6. Transacciones completas ⭐⭐⭐⭐

Cada operación crítica sigue el patrón:

```
BEGIN TRAN
  LOCK (WITH UPDLOCK, ROWLOCK)
  VALIDAR (estado actual, transición permitida, RowVersion)
  ACTUALIZAR (registro + estados dependientes)
  AUDITAR (evento en EQ_ComponentesEventos)
COMMIT
```

---

## Prioridad P1 — Mejoras sustanciales

### Timeline General
No solo componentes. Timeline unificado para:
- Equipos
- Incidencias
- Asignaciones
- Intervenciones

### Dashboard avanzado
Actualmente existe con indicadores básicos. Mejorar con:
- KPIs en tiempo real
- Movimientos recientes
- Equipos por área
- Componentes por estado
- Intervenciones mensuales
- Incidencias abiertas
- Equipos próximos a mantenimiento

### Cierre automático de incidencias
```
Incidencia ABIERTA
  → Intervención asociada con Resultado = EXITOSO
  → Incidencia se cierra automáticamente a CERRADO
```

### Catálogo Tipos de Equipo
Actualmente texto libre en `TipoEquipo`.

Crear `EQ_TiposEquipo` con FK desde `EQ_Equipos`.

### Catálogo Tipos de Intervención
Actualmente texto libre.

Crear `EQ_TiposIntervencion` con FK.

### Catálogo Tipos de Incidencia
Actualmente texto libre.

Crear `EQ_TiposIncidencia` con FK.

### Catálogo Tipos de Componente
Actualmente existe parcialmente.

Regularizar con `EQ_TiposComponente` y FK.

---

## Prioridad P2 — Valor agregado

### Sistema de Notificaciones
- Correo electrónico (SMTP)
- Toast en frontend
- Centro de notificaciones interno

### Garantías
- Por equipo: fecha de compra, fecha fin de garantía
- Alertas automáticas (30 días antes del vencimiento)
- Dashboard de garantías próximas a vencer

### Mantenimiento Preventivo
- Calendario de mantenimientos programados
- Programación recurrente (cada N meses)
- Recordatorios automáticos

### Historial QR
- Quién escaneó
- Cuándo
- Desde dónde (IP / ubicación)
- Desde qué dispositivo

### Reportes
- PDF
- Excel
- CSV
- Exportaciones por módulo (Equipos, Componentes, Asignaciones, etc.)

---

## Prioridad P3 — Calidad de código

### Tests
- Unitarios (servicios críticos, validadores)
- Integración (flujos completos: crear asignación → cesar)
- Frontend (componentes clave con Testing Library)

### JSDoc
Documentar funciones y módulos del backend con JSDoc.

### TypeScript
Migración gradual del backend y frontend.

### Seguridad
- Helmet (cabeceras HTTP seguras)
- Rate Limiter (express-rate-limit)
- Logs estructurados (winston/pino)

### Auditoría automática
Actualmente depende del service (cada service debe acordarse de auditar).

Crear:
- **Wrapper** de servicio que audite automáticamente
- **Middleware** post-operación para tablas/operaciones configuradas

---

## Recomendaciones de Arquitectura (no implementadas)

### 1. Motor de Workflow
Actualmente los estados están distribuidos en varios servicios. Un motor central de transiciones validaría automáticamente si un cambio de estado es permitido, centralizando la lógica en un solo lugar.

### 2. Buscador global
Barra de búsqueda única que encuentre simultáneamente:
- Equipos
- Componentes
- Trabajadores
- Incidencias
- Intervenciones

### 3. Historial unificado
Vista cronológica de toda la historia de un activo:
```
Equipo → Asignación → Incidencia → Intervención → Cambio de componente
→ Mantenimiento → Reasignación → Baja
```

### 4. Panel de administración
Gestión centralizada de:
- Catálogos (tipos de equipo, componente, incidencia, intervención)
- Motivos de baja y cese
- Configuración del sistema
- Usuarios y roles
