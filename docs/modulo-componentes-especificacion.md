# Módulo de Componentes — Especificación Técnica

> Fecha: Julio 2026
> Versión: 1.0
> Estado: Pendiente de implementación

---

## 1. Objetivo del módulo

Administrar cada componente tecnológico durante todo su ciclo de vida, garantizando trazabilidad completa: qué es, dónde está, por qué se movió, quién lo hizo, cuándo ocurrió y qué cambió.

## 2. Problemas actuales

- `Tab_EQ_Componentes` no registra modificación ni baja correctamente
- Estado `ASIGNADO` no diferencia entre instalación en equipo y entrega a trabajador
- Fechas como `DATE` sin hora
- Intervención solo contempla 1 componente instalado + 1 retirado
- No existe tabla canónica e inmutable de eventos
- Algunas operaciones sin transacción compartida
- Estados predeterminados silenciosos en repositorios

## 3. Clasificación de componentes

| Categoría | Ejemplos | Control |
|---|---|---|
| REPUESTO_TECNICO | RAM, SSD, pantalla, batería | Individual, serializado |
| ACCESORIO | Teclado, mouse, cargador | Asignable a trabajador o equipo |
| CONSUMIBLE | Tóner, pilas, cables genéricos | Por stock (módulo separado) |

## 4. Estados del componente

```
DISPONIBLE
INSTALADO_EQUIPO
ASIGNADO_TRABAJADOR
EN_MANTENIMIENTO
BAJA
```

Transiciones definidas en documento completo (sección 5.1).

## 5. Cambios en Tab_EQ_Componentes

Nuevas columnas: `FecModificacion`, `IdUsuarioModifica`, `FecBaja`, `IdUsuarioBaja`, `MotivoBaja`, `DisposicionFinal`, `RowVersion`.

## 6. Nueva tabla: Tab_EQ_ComponentesEventos

Tabla inmutable de auditoría cronológica. Eventos: CREACION, EDICION, INSTALACION_EQUIPO, RETIRO_EQUIPO, ASIGNACION_TRABAJADOR, DEVOLUCION_TRABAJADOR, INGRESO_MANTENIMIENTO, SALIDA_MANTENIMIENTO, REVISION, REPARACION, CAMBIO_ESTADO, BAJA, CORRECCION_ADMINISTRATIVA, MIGRACION_INICIAL.

## 7. Nueva tabla: Tab_EQ_IntervencionesComponentes

Permite múltiples componentes por intervención. Acciones: INSTALADO, RETIRADO, REVISADO, REPARADO, LIMPIADO, DADO_DE_BAJA.

## 8. Cambios en tablas existentes

- `Tab_EQ_MovEquiposComponentes`: agregar `IdUsuarioRetiro`, `FecRetiro`, `EstadoResultado`, `IdIntervencionRetiro`, `MotivoInstalacion`, `MotivoRetiro`
- `Tab_EQ_MovAccesoriosTrabajador`: agregar `IdUsuarioCese`, `MotivoCese`, `FecCeseExacta`, `EstadoResultado`

## 9. Endpoints

```
GET    /api/componentes
GET    /api/componentes/:id
GET    /api/componentes/:id/detalle
GET    /api/componentes/:id/historial
GET    /api/componentes/:id/ubicacion-actual
GET    /api/componentes/:id/acciones-permitidas
POST   /api/componentes
PUT    /api/componentes/:id
PATCH  /api/componentes/:id
POST   /api/componentes/:id/instalaciones
POST   /api/componentes/:id/retiros
POST   /api/componentes/:id/asignaciones-trabajador
POST   /api/componentes/:id/devoluciones
POST   /api/componentes/:id/mantenimiento/ingreso
POST   /api/componentes/:id/mantenimiento/salida
POST   /api/componentes/:id/baja
```

## 10. Reglas transaccionales

Cada operación: bloquear componente con `UPDLOCK, HOLDLOCK`, validar estado, ejecutar cambio, registrar evento, confirmar. Todo en una transacción.

## 11. Control de concurrencia

- Bloqueo pesimista con `UPDLOCK, HOLDLOCK` para operaciones críticas
- `RowVersion` para actualizaciones de datos (optimista, 409 si desactualizado)

## 12. Restricciones BD

- `UX_Componentes_CodComponente` (único)
- `UX_Componentes_Serie` (único filtrado, no nulo)
- `CK_Componentes_Estado` (check de estados válidos)
- `UX_MovEquiposComponentes_Activo` (un vínculo vigente por componente)
- `UX_MovAccesoriosTrabajador_Activo` (una asignación vigente por componente)

## 13. Prioridad de implementación

**Crítica**: motivo/usuario/fecha de baja, estados correctos en retiros, transaccionalidad, tabla de eventos, impedir doble vínculo, usuario de inicio/cierre.

**Alta**: estados específicos, intervenciones multi-componente, contrato detalle unificado, timeline, concurrencia.

**Posterior**: consumibles separados, auditoría ampliada, reportes, exportación.
