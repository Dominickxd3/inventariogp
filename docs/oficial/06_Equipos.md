# 06 — Equipos

> **Propósito**: Documentación del módulo de Equipos — activos tecnológicos y su ciclo de vida.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## 1. ¿Qué es un equipo?

Cualquier activo tecnológico que se asigna a un trabajador: laptops, PCs de escritorio, monitores, impresoras, celulares, tablets, switches, access points, etc.

No hay catálogo fijo de tipos de equipo — el usuario puede ingresar cualquier valor en `TipoEquipo`.

## 2. Estados de equipo

| Estado | Significado |
|--------|-------------|
| `DISPONIBLE` | En almacén, sin asignar |
| `ASIGNADO` | En uso por un trabajador |
| `MANTENIMIENTO` | En reparación o revisión técnica |
| `BAJA` | Dado de baja (obsoleto, robado, perdido) |
| `RESGUARDADO` | En resguardo (no asignado pero apartado) |

### Transiciones de estado

```
               ┌──────────┐
               │ DISPONIBLE│
               └────┬─────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌──────────┐
   │ASIGNADO │ │RESGUARD.│ │MANTENIM. │
   └────┬────┘ └─────────┘ └────┬─────┘
        │                       │
        ▼                       ▼
   ┌──────────┐           ┌──────────┐
   │ DISPONIBLE│           │ DISPONIBLE│
   │ (cese)   │           │ (fin mto)│
   └──────────┘           └──────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
              ┌────────┐
              │  BAJA  │
              │ (obsol.│
              │  robo) │
              └────────┘
```

## 3. Ciclo de vida típico

```
1. Ingresa al inventario → DISPONIBLE
2. Se asigna a trabajador → ASIGNADO (se crea EQ_Asignaciones)
3. Se devuelve → DISPONIBLE (se cesa EQ_Asignaciones)
   - Si es por falla → MANTENIMIENTO
   - Si es obsoleto/robo → BAJA
4. Se repara → DISPONIBLE
5. Se reasigna → ASIGNADO
6. Se da de baja definitiva → BAJA
```

## 4. QR

Cada equipo tiene un código QR generado a partir de `CodigoInterno` (o `NumeroSerie` como fallback).

El QR se puede:
- **Descargar** como PNG (qrcode.react + canvas)
- **Copiar** enlace al portapapeles
- **Escanear** desde la web (html5-qrcode) → `/equipos/scan/:codigo`

## 5. Características soportadas

| Funcionalidad | Estado |
|---------------|--------|
| CRUD completo | ✅ |
| QR individual (descargar, copiar, abrir) | ✅ |
| Escaneo QR por cámara web | ✅ |
| Historial de asignaciones | ✅ |
| Componentes instalados visibles | ✅ |
| Intervenciones visibles en detalle | ✅ |
| Vista de timeline (equipos recientes) | 🟡 Parcial |
| Importación masiva Excel/CSV | ✅ |
| Dashboard con métricas por tipo/estado | ✅ |
| Filtros combinados (tipo + estado + búsqueda) | ✅ |

## 6. Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/equipos` | Lista paginada y filtrada |
| POST | `/api/equipos` | Crear equipo |
| PUT | `/api/equipos/:id` | Actualizar equipo |
| GET | `/api/equipos/:id` | Detalle completo |
| POST | `/api/equipos/baja/:id` | Dar de baja |
| GET | `/api/equipos/tipos` | Tipos disponibles |
| GET | `/api/equipos/scan/:codigo` | Búsqueda por código QR |
| POST | `/api/equipos/importar` | Importación masiva |
