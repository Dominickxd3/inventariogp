# 03 — Reglas de Negocio

> **Propósito**: Catálogo de todas las reglas de negocio implementadas en el sistema, extraídas del código fuente.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

> ⚠️ Los nombres de tablas en este documento usan la nomenclatura corta `EQ_*` (ej: `EQ_AsignacionesAcc`). Los nombres reales en BD son `Tab_EQ_*` (ej: `Tab_EQ_MovEquiposAsignaciones`, `Tab_EQ_MovAccesoriosTrabajador`). Ver `backend/src/repositories/` para la nomenclatura exacta.

## Convenciones del documento

- Cada regla tiene un ID único (RN-XX).
- La fuente indica dónde se implementa la regla.
- Las reglas marcadas como 💡 RECOMENDACIÓN no están implementadas.

---

## Módulo: Equipos (RN-EQ)

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-EQ-01 | Al crear un equipo, su estado inicial es `DISPONIBLE` y `FechaBaja` queda NULL | `equipos.service.js` |
| RN-EQ-02 | No se puede dar de baja un equipo que tiene asignaciones activas | `equipos.service.js` |
| RN-EQ-03 | `NumeroSerie` y `CodigoInterno` son opcionales pero deben ser únicos si se proporcionan | BD (UNIQUE NULLable) |
| RN-EQ-04 | Un equipo puede tener cualquier valor de `TipoEquipo` (no hay catálogo fijo) | `equipos.service.js` |
| RN-EQ-05 | El cambio de estado del equipo se realiza automáticamente al asignar, cesar, etc. (transiciones manejadas en servicios) | `asignaciones.service.js` |
| RN-EQ-06 | Al cesar una asignación, el equipo pasa a `DISPONIBLE`, `MANTENIMIENTO` o `BAJA` según el motivo de cese | `asignaciones.service.js` |
| RN-EQ-07 | `Mantenimiento` es una palabra clave para activar filtro en el frontend, no un campo dedicado | Inferencia de `Equipos.jsx` |

## Módulo: Asignaciones (RN-AS)

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-AS-01 | Un trabajador puede tener múltiples equipos asignados simultáneamente si su cargo lo justifica | `asignaciones.service.js` |
| RN-AS-02 | Un equipo solo puede tener una asignación `VIGENTE` a la vez | Backend valida con `WHERE Estado = 'VIGENTE'` |
| RN-AS-03 | Si el equipo ya tiene una asignación vigente, se rechaza la nueva con error 409 | `asignaciones.service.js` |
| RN-AS-04 | Los accesorios se asignan con acción `ASIGNADO` o `INSTALADO` en `EQ_AsignacionesAcc` | `asignaciones.service.js` |
| RN-AS-05 | Al cesar una asignación, se actualiza `Estado = 'CESADA'` y se registra `FechaFin`, `MotivoCese` y `Obs` | `asignaciones.service.js` |
| RN-AS-06 | No se puede cesar una asignación que ya está `CESADA` (UPDATE condicional) | `asignaciones.service.js` |
| RN-AS-07 | Los motivos de cese controlados son: `Devolución voluntaria`, `Cambio de equipo`, `Rotura/Falla técnica`, `Equipo obsoleto`, `Robo/Extravío`, `Trabajador se retiró`, `Mantenimiento preventivo`, `Asignación incorrecta`, `Fin de contrato/proyecto` | Backend z.enum validator |
| RN-AS-08 | Si el motivo de cese es `Rotura/Falla técnica` → estado equipo `MANTENIMIENTO`; si es `Equipo obsoleto` o `Robo/Extravío` → `BAJA`; cualquier otro → `DISPONIBLE` | `asignaciones.service.js` |
| RN-AS-09 | Al cesar, los accesorios ligados se retornan automáticamente a estado `DISPONIBLE` | `asignaciones.service.js` |

## Módulo: Componentes (RN-CO)

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-CO-01 | Un componente nace en estado `DISPONIBLE` | `componentes.service.js` |
| RN-CO-02 | Al instalar un componente en un equipo, pasa a `INSTALADO` en `EQ_EquiposComponentes` | `intervenciones.service.js` |
| RN-CO-03 | Un componente no puede instalarse en dos equipos simultáneamente (revisar antes de asignar) | BD: `IdComponente` UNIQUE en `EQ_EquiposComponentes` |
| RN-CO-04 | Al instalar un componente vía asignación (como accesorio), se registra con acción `ASIGNADO` o `INSTALADO` en `EQ_AsignacionesAcc` | `asignaciones.service.js` |
| RN-CO-05 | No hay registro de movimiento de componentes (cuándo entró/salió de almacén) | 💡 RECOMENDACIÓN |
| RN-CO-06 | El estado `ASIGNADO` en componentes existe en BD pero no se usa en la práctica | 🔍 INFERENCIA |

## Módulo: Incidencias (RN-IN)

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-IN-01 | Solo se pueden reportar incidencias sobre equipos existentes | FK en BD |
| RN-IN-02 | Una incidencia `ABIERTA` puede pasar a `EN_PROCESO` y de ahí a `CERRADO` | `incidencias.service.js` |
| RN-IN-03 | Al crear una incidencia `ABIERTA`, el equipo asociado NO cambia de estado automáticamente | 🔍 INFERENCIA |
| RN-IN-04 | Al cerrar una incidencia (pasar a `CERRADO`), se puede especificar `Solucion` | `incidencias.service.js` |

## Módulo: Intervenciones (RN-IV)

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-IV-01 | Una intervención se asocia a un equipo y opcionalmente a una incidencia | `intervenciones.service.js` |
| RN-IV-02 | Una intervención puede instalar, retirar o reemplazar componentes | `intervenciones.service.js` |
| RN-IV-03 | Al instalar un componente en intervención, este pasa a `INSTALADO` en el equipo | `intervenciones.service.js` |
| RN-IV-04 | Al retirar un componente, este vuelve a `DISPONIBLE` | `intervenciones.service.js` |

## Módulo: Usuarios/Auth (RN-UA)

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-UA-01 | Solo ADMIN puede crear/modificar usuarios | `auth.js` middleware |
| RN-UA-02 | Las contraseñas se almacenan hasheadas con bcrypt | `auth.service.js` |
| RN-UA-03 | El usuario debe tener estado `Activo = 1` para poder iniciar sesión | `auth.service.js` |
| RN-UA-04 | Cada intento de login (exitoso o fallido) se registra en `EQ_LoginAudit` | `auth.service.js` |
| RN-UA-05 | La contraseña mínima es 6 caracteres | `validators.js` |

## Módulo: Trabajadores (RN-TR)

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-TR-01 | El directorio de trabajadores se sincroniza desde RRHH (INS/UPD/DEL externo) | `trabajadores.service.js` |
| RN-TR-02 | DNI es único por trabajador | BD (UNIQUE) |
| RN-TR-03 | Al eliminar un trabajador (borrado lógico `Activo = 0`), no se puede asignar nuevos equipos hasta reactivarlo | 🔍 INFERENCIA |
| RN-TR-04 | Un trabajador con `Activo = 0` conserva el histórico de asignaciones pasadas | 🔍 INFERENCIA |

## Módulo: Cese de Asignaciones

| ID | Regla | Implementación |
|----|-------|---------------|
| RN-CE-01 | El cese de una asignación requiere motivo y observación (500 chars max) | `validators.js`, `CesarAsignacionDialog.jsx` |
| RN-CE-02 | El cese no se puede ejecutar dos veces sobre la misma asignación (UPDATE solo si `Estado = 'VIGENTE'`) | `asignaciones.service.js` |
| RN-CE-03 | Una vez cesada la asignación, el equipo cambia su estado automáticamente según el motivo | `asignaciones.service.js` |
| RN-CE-04 | Si el motivo es `Rotura/Falla técnica` → equipo a `MANTENIMIENTO` | `asignaciones.service.js` |
| RN-CE-05 | Si el motivo es `Equipo obsoleto` o `Robo/Extravío` → equipo a `BAJA` | `asignaciones.service.js` |
| RN-CE-06 | Cualquier otro motivo → equipo a `DISPONIBLE` | `asignaciones.service.js` |
| RN-CE-07 | Los accesorios ligados a la asignación vuelven a `DISPONIBLE` al cesar | `asignaciones.service.js` |
