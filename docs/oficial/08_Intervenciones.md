# 08 — Intervenciones

> **Propósito**: Documentación del módulo de Intervenciones — mantenimiento, reparación y reemplazo de componentes.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## 1. ¿Qué es una intervención?

Registro de una acción técnica realizada sobre un equipo: mantenimiento preventivo, reparación correctiva, instalación/retiro/revisión/reparación de componentes, reemplazo de piezas.

## 2. Tipos de intervención

Actualmente texto libre. **P1**: Migrar a catálogo `EQ_TiposIntervencion` con FK.

Ejemplos:
- `Mantenimiento preventivo`
- `Reparación correctiva`
- `Actualización de hardware`
- `Diagnóstico técnico`
- `Limpieza interna`
- `Reemplazo de pieza`

## 3. Resultados

| Resultado | Significado |
|-----------|-------------|
| `EXITOSO` | Intervención completada satisfactoriamente |
| `PARCIAL` | Se resolvió parcialmente, queda pendiente |
| `FALLIDO` | No se pudo resolver, requiere otra acción |

## 4. Componentes en intervención (P0 — Multi-Componente)

### Antes (limitación actual)
```
1 instalado + 1 retirado  ← ❌
```

### Después (P0)
```
N instalados
N retirados
N revisados
N reparados
```

### Tabla `EQ_IntervencionesComponentes`

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

### Efecto de cada acción sobre el componente

| Acción | Transición de estado |
|--------|---------------------|
| `INSTALAR` | DISPONIBLE → INSTALADO (en el equipo de la intervención) |
| `RETIRAR` | INSTALADO → DISPONIBLE |
| `REEMPLAZAR` | Componente viejo: INSTALADO → DISPONIBLE; nuevo: DISPONIBLE → INSTALADO |
| `REVISAR` | Sin cambio de estado (solo diagnóstico) |
| `REPARAR` | MANTENIMIENTO → DISPONIBLE (reparado exitosamente) |

## 5. API endpoints P0

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/intervenciones` | Lista paginada |
| POST | `/api/intervenciones` | Crear intervención con arrays de componentes: `{ instalados: [], retirados: [], revisados: [], reparados: [] }` |
| PUT | `/api/intervenciones/:id` | Actualizar intervención |
| GET | `/api/intervenciones/:id` | Detalle con todos los componentes agrupados por acción |

### Body del POST (nuevo)
```json
{
  "IdEquipo": 1,
  "IdIncidencia": null,
  "TipoIntervencion": "Reparación correctiva",
  "Descripcion": "Reemplazo de RAM y SSD",
  "Resultado": "EXITOSO",
  "FechaInicio": "2026-07-20T10:00:00",
  "FechaFin": "2026-07-20T11:30:00",
  "IdCreadoPor": 1,
  "instalados": [5, 12],
  "retirados": [3],
  "revisados": [8],
  "reparados": []
}
```

## 6. Frontend P0

### Formulario de intervención (multi-componente)
- Sección "Componentes a instalar": selector multi (checkboxes o select múltiple)
- Sección "Componentes a retirar": selector multi (solo componentes INSTALADOS en el equipo)
- Sección "Componentes a revisar": selector multi
- Sección "Componentes a reparar": selector multi (solo componentes MANTENIMIENTO)
- Estado visual: resumen de componentes seleccionados con badges

### Vista detalle
- Lista de componentes agrupada por acción (INSTALADOS | RETIRADOS | REVISADOS | REPARADOS)

## 7. Cierre automático de incidencias (P1)

Si una intervención se crea asociada a una incidencia (`IdIncidencia` presente) y el resultado es `EXITOSO`:
- La incidencia se cierra automáticamente (Estado → `CERRADO`)
- Se registra en la incidencia que se cerró por intervención exitosa

## 8. Catálogo de tipos (P1)

Crear `EQ_TiposIntervencion`:
| Columna | Tipo |
|---------|------|
| IdTipoIntervencion | INT PK IDENTITY |
| Nombre | VARCHAR(50) NOT NULL UNIQUE |

Migrar el campo `TipoIntervencion` en `EQ_Intervenciones` de VARCHAR libre a FK.
