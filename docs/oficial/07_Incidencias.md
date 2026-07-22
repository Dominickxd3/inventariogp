# 07 — Incidencias

> **Propósito**: Documentación del módulo de Incidencias — reporte y seguimiento de fallas en equipos.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## 1. ¿Qué es una incidencia?

Reporte de una falla, problema o anomalía en un equipo del inventario. Puede ser reportada por cualquier trabajador (aunque actualmente solo la registra un usuario del sistema).

## 2. Estados de incidencia

| Estado | Significado |
|--------|-------------|
| `ABIERTO` | Reportado, pendiente de atención |
| `EN_PROCESO` | Un técnico está trabajando en ella |
| `CERRADO` | Resuelta, con solución registrada |

## 3. Flujo típico

```
1. Técnico reporta incidencia sobre un equipo → ABIERTO
2. Se asigna/atiende → EN_PROCESO
3. Se realiza intervención y se cierra → CERRADO
```

## 4. Comportamiento actual

| Funcionalidad | Estado |
|---------------|--------|
| Crear incidencia con tipo, prioridad, descripción | ✅ |
| Cambiar estado (ABIERTO → EN_PROCESO → CERRADO) | ✅ |
| Asociación con intervención técnica | ✅ |
| Asociación con equipo (FK) | ✅ |
| Cierre automático del equipo al cerrar incidencia | 🔴 No implementado |
| Notificaciones al reportante | ❌ No implementado |

## 5. Prioridades

| Prioridad | Significado |
|-----------|-------------|
| `BAJA` | Problema menor, puede esperar |
| `MEDIA` | Afecta productividad, no crítico |
| `ALTA` | Bloqueante para el trabajador |
| `CRITICA` | Sin equipo no puede trabajar |

## 6. Relación con intervenciones

Una incidencia **puede** derivar en una o más intervenciones técnicas. La relación es:
- `EQ_Incidencias.IdEquipo` → equipo afectado
- `EQ_Intervenciones.IdIncidencia` → incidencia que originó la intervención (opcional)

## 7. Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/incidencias` | Lista paginada |
| POST | `/api/incidencias` | Crear incidencia |
| PUT | `/api/incidencias/:id` | Actualizar (estado, solución) |
| GET | `/api/incidencias/:id` | Detalle con intervenciones asociadas |
