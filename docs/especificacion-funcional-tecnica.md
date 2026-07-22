# InventarioGP — Especificación Funcional y Técnica

> Versión: 1.0
> Última actualización: Julio 2026
> Propósito: Fuente única de verdad del proyecto

---

## Índice

1. [Objetivo del sistema](#1-objetivo-del-sistema)
2. [Arquitectura](#2-arquitectura)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Catálogo oficial de estados](#5-catálogo-oficial-de-estados)
6. [Reglas de negocio](#6-reglas-de-negocio)
7. [Roles y permisos](#7-roles-y-permisos)
8. [Flujos de módulos](#8-flujos-de-módulos)
9. [API — Contratos](#9-api--contratos)
10. [Convenciones del proyecto](#10-convenciones-del-proyecto)
11. [Decisiones de arquitectura (ADR)](#11-decisiones-de-arquitectura-adr)
12. [Roadmap](#12-roadmap)

---

## 1. Objetivo del sistema

> **HECHO COMPROBADO** — Inferido del código fuente, tablas y rutas.

Sistema web interno del área de sistemas/Grupo Pecuario para administrar el ciclo de vida de activos tecnológicos:

- **Equipos**: cómputo, redes, periféricos (LAPTOP, PC, MONITOR, IMPRESORA, CELULAR, TABLET, SWITCH, ACCESS POINT)
- **Componentes**: repuestos técnicos (RAM, SSD, HDD, etc.) y accesorios (teclado, mouse, cargador, etc.)
- **Trabajadores**: directorio sincronizado desde RRHH
- **Asignaciones**: entrega y devolución de equipos a trabajadores
- **Incidencias**: reporte de fallas en equipos
- **Intervenciones técnicas**: mantenimiento, reparación, reemplazo de componentes

---

## 2. Arquitectura

> **HECHO COMPROBADO** — Verificado en `backend/src/index.js`, `frontend/src/main.jsx`, `frontend/src/App.jsx`.

### 2.1 Vista general

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                  │
│  Vite 8 · Tailwind CSS 4 · shadcn/ui · React Query 5   │
│  React Table 8 · react-router-dom 7                     │
│  :5173 (dev)                                             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/JSON · JWT Bearer
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express 4)                     │
│  Node.js 24 · mssql 11 · Zod 3 · Helmet · JWT           │
│  :3001                                                    │
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌──────────────┐            │
│  │ Routes  │→ │Services │→ │ Repositories │ → SQL      │
│  │(valida) │  │(reglas) │  │ (consultas)   │            │
│  └─────────┘  └─────────┘  └──────────────┘            │
└──────────────────────┬──────────────────────────────────┘
                       │ TDS (mssql)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              SQL Server 2019+                            │
│  BD: InventarioGP · SIGA_ASISTENCIA (solo lectura)       │
│  dbGP_2024_GP (solo lectura)                             │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Capas del backend

| Capa | Responsabilidad | Prohibiciones |
|------|----------------|---------------|
| **Route** | Validar params/body (Zod), verificar auth + rol, llamar service, devolver DTO | Sin reglas de negocio |
| **Service** | Reglas de negocio, transacciones, coordinar repos, registrar eventos | Sin SQL directo |
| **Repository** | Consultas SQL, inserts, updates, bloqueos | Sin lógica de negocio ni estados predeterminados |

> **HECHO COMPROBADO** — Verificado en todos los archivos de rutas, servicios y repositorios.

### 2.3 Middleware (orden de carga)

> **HECHO COMPROBADO** — Verificado en `backend/src/index.js` línea por línea.

1. `helmet()` — headers de seguridad (CSP deshabilitado)
2. `cors(config.cors.origins)` — orígenes desde env
3. `express.json({ limit: '1mb' })`
4. `morgan()` — logging
5. `loginLimiter(10/15min)` — solo en `/api/auth/login`
6. Routes
7. `errorHandler` — sanitiza errores SQL en producción

---

## 3. Stack Tecnológico

> **HECHO COMPROBADO** — Verificado en `package.json` de backend y frontend.

### Backend

| Dependencia | Versión | Uso |
|-------------|---------|-----|
| express | ^4.21.0 | Framework HTTP |
| mssql | ^11.0.1 | Driver SQL Server |
| zod | ^3.23.8 | Validación de esquemas |
| jsonwebtoken | ^9.0.3 | JWT |
| bcrypt | ^6.0.0 | Hash de contraseñas (NO COMPROBADO su uso real) |
| helmet | ^8.2.0 | Headers de seguridad |
| cors | ^2.8.5 | CORS |
| morgan | ^1.10.0 | Logging HTTP |
| express-rate-limit | ^8.5.2 | Rate limiting |
| dotenv | ^16.4.5 | Variables de entorno |
| qrcode | ^1.5.4 | Generación de QR |
| uuid | ^10.0.0 | UUID (NO COMPROBADO su uso real) |

### Frontend

| Dependencia | Versión | Uso |
|-------------|---------|-----|
| react | ^19 | UI |
| react-router-dom | ^7 | Routing |
| @tanstack/react-query | ^5 | Server state |
| @tanstack/react-table | ^8 | Tablas de datos |
| react-hook-form | ^7 | Formularios |
| zustand | ^5 | Estado cliente |
| recharts | - | Gráficos (Dashboard) |
| lucide-react | - | Iconos |
| tailwindcss | ^4 | CSS utilitario |
| html5-qrcode | - | Escáner QR |
| qrcode.react | - | Generación QR |
| sweetalert2 | - | Diálogos/alertas |

---

## 4. Modelo de Datos

> **HECHO COMPROBADO** — Verificado en `create_core_tables.sql`, migraciones SQL, y consultas en repositorios.

### 4.1 Diagrama de tablas

Base de datos: `InventarioGP`

**Bases externas** (solo lectura):
- `SIGA_ASISTENCIA.dbo.Personal_periodo` — datos personales de trabajadores (join en incidencias)
- `dbGP_2024_GP` — referencia en config, NO COMPROBADO su uso real

### 4.2 Tablas maestro-detalle

#### Tab_EQ_TipodeEquipos — Catálogo de tipos de equipo

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdTipodeEquipo | INT IDENTITY(1,1) | **PK** |
| CodTipodeEquipo | VARCHAR(10) | NULL |
| DesTipodeEquipo | VARCHAR(100) | NOT NULL |
| Estado | VARCHAR(20) | NULL, **DEFAULT 'ACTIVO'** |
| FecCreacion | DATETIME | NULL, **DEFAULT GETDATE()** |

#### Tab_EQ_MaeEquipos — Catálogo principal de equipos

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdMaeEquipo | INT IDENTITY(1,1) | **PK** |
| CodEquipo | VARCHAR(50) | NULL |
| IdTipodeEquipo | INT | NULL, **FK → Tab_EQ_TipodeEquipos(IdTipodeEquipo)** |
| NombreEquipo | VARCHAR(200) | NULL |
| Marca | VARCHAR(100) | NULL |
| Modelo | VARCHAR(100) | NULL |
| Serie | VARCHAR(100) | NULL |
| SerieFabricante | VARCHAR(100) | NULL, **UNIQUE INDEX** (filtrado, no nulo) |
| SinSerieVisible | BIT | NOT NULL, **DEFAULT 0** |
| CodBarra | VARCHAR(100) | NULL |
| Estado | VARCHAR(30) | NULL, **DEFAULT 'DISPONIBLE'** |
| EsNuevo | BIT | NULL |
| FecCompra | DATE | NULL |
| GarantiaMeses | INT | NULL |
| FecFinGarantia | DATE | NULL |
| Proveedor | VARCHAR(150) | NULL |
| DocumentoCompra | VARCHAR(100) | NULL |
| Obs | VARCHAR(MAX) | NULL |
| FecCreacion | DATETIME | NULL, **DEFAULT GETDATE()** |
| IdUsuarioCrea | INT | NULL |
| FecModificacion | DATETIME | NULL |
| IdUsuarioModifica | INT | NULL |

> **HALLAZGO**: No existe UNIQUE INDEX sobre `CodEquipo` ni `CodBarra` a nivel BD. La unicidad se valida solo en el servicio.

#### Tab_EQ_TipodeComponentes — Catálogo de tipos de componente

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdTipodeComponente | INT IDENTITY(1,1) | **PK** |
| CodTipodeComponente | VARCHAR(10) | NULL |
| DesTipodeComponente | VARCHAR(100) | NOT NULL |
| Categoria | VARCHAR(50) | NULL — valores: 'REPUESTO_TECNICO', 'ACCESORIO', 'CONSUMIBLE' |
| Estado | VARCHAR(20) | NULL, **DEFAULT 'ACTIVO'** |
| FecCreacion | DATETIME | NULL, **DEFAULT GETDATE()** |

#### Tab_EQ_Componentes — Inventario de componentes

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdComponente | INT IDENTITY(1,1) | **PK** |
| IdTipodeComponente | INT | NULL, **FK → Tab_EQ_TipodeComponentes(IdTipodeComponente)** |
| CodComponente | VARCHAR(50) | NULL |
| DesComponente | VARCHAR(200) | NULL |
| Marca | VARCHAR(100) | NULL |
| Modelo | VARCHAR(100) | NULL |
| Serie | VARCHAR(100) | NULL |
| Lote | VARCHAR(100) | NULL |
| Capacidad | VARCHAR(100) | NULL |
| Obs | VARCHAR(MAX) | NULL |
| Estado | VARCHAR(20) | NULL, **DEFAULT 'DISPONIBLE'** |
| IdUsuarioCrea | INT | NULL |
| FecCreacion | DATETIME | NULL, **DEFAULT GETDATE()** |

> **AUSENTE**: No existen columnas `FecModificacion`, `IdUsuarioModifica`, `FecBaja`, `IdUsuarioBaja`, `MotivoBaja`, `DisposicionFinal`, `RowVersion`. No existe UNIQUE INDEX sobre `CodComponente` ni `Serie`. No existe CHECK CONSTRAINT sobre `Estado`.

#### Tab_EQ_Trabajadores — Directorio de personal

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdTrabajador | INT IDENTITY(1,1) | **PK** |
| IdTrabajadorERP | INT | NULL |
| DOI | VARCHAR(20) | NULL — DNI |
| Trabajador | VARCHAR(200) | NULL — nombre completo |
| Area | VARCHAR(100) | NULL |
| Ocupacion | VARCHAR(100) | NULL — cargo |
| Estado | VARCHAR(20) | NULL, **DEFAULT 'ACTIVO'** |
| Activo | VARCHAR(1) | NULL |

> **HALLAZGO**: `Activo` es VARCHAR(1), no BIT. Se compara como `String(t.Activo) !== '1'`.

#### Tab_SYS_Usuarios — Usuarios del sistema (pre-existente)

| Columna | Tipo | Uso en código |
|---------|------|---------------|
| IdUsuario | INT | PK — referenciado como FK en operaciones |
| User_Logon | VARCHAR(50) | Login |
| User_Fullname | VARCHAR(150) | Nombre para mostrar |
| User_Email | VARCHAR(100) | Email |
| SwAcceso | VARCHAR(20) | **Debe ser truthy** para login |
| Rol | VARCHAR(20) | 'ADMIN', 'TECNICO' |
| FecUltimoAcceso | DATETIME | Actualizado en cada login |
| FecCreacion | DATETIME | |

> **INFERENCIA** (confianza alta): Esta tabla pre-existe y su estructura no está definida en los scripts del proyecto.

### 4.3 Tablas de movimiento

#### Tab_EQ_MovEquiposAsignaciones — Asignaciones de equipos a trabajadores

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdMovEquipoAsignacion | INT IDENTITY(1,1) | **PK** |
| IdMaeEquipo | INT | NULL, **FK → Tab_EQ_MaeEquipos(IdMaeEquipo)** |
| IdTrabajador | INT | NULL, **FK → Tab_EQ_Trabajadores(IdTrabajador)** |
| FecAsignacion | DATE | NULL, **DEFAULT GETDATE()** |
| FecCese | DATE | NULL |
| Estado | VARCHAR(20) | NULL, **DEFAULT 'VIGENTE'** |
| Obs | VARCHAR(MAX) | NULL |
| IdUsuarioCrea | INT | NULL |
| FecCreacion | DATETIME | NULL, **DEFAULT GETDATE()** |

#### Tab_EQ_MovEquiposComponentes — Componentes instalados en equipos

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdMovComponente | INT IDENTITY(1,1) | **PK** |
| IdMaeEquipo | INT | NULL, **FK → Tab_EQ_MaeEquipos(IdMaeEquipo)** |
| IdComponente | INT | NULL, **FK → Tab_EQ_Componentes(IdComponente)** |
| FecAsigComponente | DATE | NULL, **DEFAULT GETDATE()** |
| FecBajaComponente | DATE | NULL |
| Estado | VARCHAR(20) | NULL, **DEFAULT 'ACTIVO'** |
| OrigenVinculo | VARCHAR(50) | NULL |
| Motivo | VARCHAR(MAX) | NULL |
| FecInstalacion | DATE | NULL |
| IdIntervencion | INT | NULL |
| Obs | VARCHAR(MAX) | NULL |
| IdUsuarioCrea | INT | NULL |

> **HALLAZGO**: El SQL de creación contiene un error de sintaxis en línea 132: `DEFAULT GETDATE(),cua` (la coma y "cua" sobran). El script no se ejecuta correctamente tal como está escrito. La tabla existe (verificable en las consultas del repositorio), por lo que el error fue corregido antes de la ejecución.
>
> **HALLAZGO**: El DEFAULT del campo `Estado` es `'ACTIVO'`, pero el repositorio inserta con `'VIGENTE'` explícitamente.

#### Tab_EQ_MovAccesoriosTrabajador — Accesorios asignados a trabajadores

> **HECHO COMPROBADO** — Solo referenciado en código, sin DDL en el proyecto.

| Columna | Tipo (inferido de consultas) |
|---------|------|
| IdMovAccesorio | INT PK |
| IdComponente | INT, FK → Tab_EQ_Componentes |
| IdReferente | INT (IdTrabajador) |
| FecAsignacion | DATE |
| FecCese | DATE |
| Estado | VARCHAR(20) — 'VIGENTE', 'CESADO', 'BAJA', 'PERDIDO' |
| Obs | VARCHAR(MAX) |
| IdUsuarioCrea | INT |
| IdMovEquipoAsignacion | INT, FK → Tab_EQ_MovEquiposAsignaciones |

> **INFERENCIA** (confianza media): Estructura reconstruida desde consultas en `componentes.repository.js` y `asignaciones.service.js`.

#### Tab_EQ_MovEstadosEquipos — Historial de cambios de estado de equipos

> **HECHO COMPROBADO** — Solo referenciado en código.

| Columna | Tipo (inferido) |
|---------|------|
| IdMovEstado | INT PK |
| IdMaeEquipo | INT |
| EstadoAnterior | VARCHAR(30) |
| EstadoNuevo | VARCHAR(30) |
| IdUsuario | INT |
| Obs | VARCHAR(MAX) |
| FecCambio | DATETIME |

#### Tab_EQ_Incidencias — Incidencias reportadas

> **HECHO COMPROBADO** — Solo referenciado en código.

| Columna | Tipo (inferido) |
|---------|------|
| IdIncidencia | INT PK |
| IdMaeEquipo | INT, FK |
| IdReferente | INT (trabajador que reporta) |
| TipoIncidencia | VARCHAR(50) |
| Descripcion | VARCHAR(MAX) |
| FecIncidencia | DATE |
| FecRegistro | DATETIME |
| Estado | VARCHAR(20) — 'ABIERTO', 'CERRADO' |

#### Tab_EQ_IntervencionesTecnicas — Intervenciones técnicas

> **HECHO COMPROBADO** — Solo referenciado en código.

| Columna | Tipo (inferido) |
|---------|------|
| IdIntervencion | INT PK |
| IdMaeEquipo | INT, FK |
| IdIncidencia | INT, FK (opcional) |
| IdComponenteInstalado | INT, FK (opcional) |
| IdComponenteRetirado | INT, FK (opcional) |
| TipoIntervencion | VARCHAR(50) |
| Descripcion | VARCHAR(MAX) |
| IdUsuario | INT |
| Estado | VARCHAR(20) — 'REGISTRADO' |
| PiezaAfectada | VARCHAR(200) |
| ComponenteRetiradoNoInventariado | BIT |
| Resultado | VARCHAR(MAX) |
| RequiereReparacion | BIT |
| SoftwareInstalado | VARCHAR(200) |
| Version | VARCHAR(50) |
| MotivoBaja | VARCHAR(MAX) |
| FecIntervencion | DATETIME |

#### Tab_EQ_CaracteristicasEquipo — Atributos dinámicos por equipo

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| IdCaracteristica | INT IDENTITY(1,1) | **PK** |
| IdMaeEquipo | INT | NOT NULL, **FK → Tab_EQ_MaeEquipos(IdMaeEquipo)** |
| Clave | VARCHAR(100) | NOT NULL |
| Valor | VARCHAR(500) | NULL |
| IdPlantilla | INT | NULL (migración 003) |
| FecRegistro | DATETIME | **DEFAULT GETDATE()** |
| IdUsuarioCrea | INT | NULL |
| IdUsuarioModifica | INT | NULL |
| FecModificacion | DATETIME | NULL |

Índice: `IX_Caracteristicas_IdMaeEquipo` sobre `(IdMaeEquipo)`.

#### Tab_EQ_PlantillaCaracteristicas — Plantilla por tipo de equipo

> **HECHO COMPROBADO** — Solo referenciado en código.

| Columna | Tipo (inferido) |
|---------|------|
| IdPlantilla | INT PK |
| IdTipodeEquipo | INT |
| Clave | VARCHAR(100) |
| Etiqueta | VARCHAR(200) |
| TipoDato | VARCHAR(50) |
| Requerido | BIT |
| Orden | INT |
| Activo | BIT |

#### Tab_SYS_LoginAudit — Auditoría de login

> **HECHO COMPROBADO** — Solo referenciado en código.

| Columna | Tipo (inferido) |
|---------|------|
| IdAudit | INT PK |
| User_Logon | VARCHAR(50) |
| FechaIntento | DATETIME |
| Exitoso | BIT |
| DireccionIP | VARCHAR(50) |
| UserAgent | VARCHAR(500) |
| Mensaje | VARCHAR(MAX) |

### 4.4 Resumen de restricciones existentes

> **HECHO COMPROBADO** — Verificado en `create_core_tables.sql` y migraciones.

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| PRIMARY KEY | 10 | Una por tabla listada |
| FOREIGN KEY | 6 | TipodeEquipos→MaeEquipos, TipodeComponentes→Componentes, MaeEquipos→Asignaciones, Trabajadores→Asignaciones, MaeEquipos→MovEquiposComponentes, Componentes→MovEquiposComponentes, MaeEquipos→CaracteristicasEquipo |
| UNIQUE INDEX | 1 | `UQ_Tab_EQ_MaeEquipos_SerieFabricante` (filtrado, migración 002) |
| CHECK | 0 | Ninguna en los scripts del proyecto |
| DEFAULT | 13 | Ver tabla por tabla arriba |

> **RECOMENDACIÓN**: Agregar `UNIQUE INDEX` sobre `CodEquipo` y `CodBarra` en `Tab_EQ_MaeEquipos`. Agregar CHECK CONSTRAINT sobre `Estado` en tablas que lo requieran. Agregar UNIQUE sobre `CodComponente` y `Serie` en `Tab_EQ_Componentes`.

---

## 5. Catálogo Oficial de Estados

> **HECHO COMPROBADO** — Extraído del código fuente. Los estados marcados como "recomendado" son sugerencias del documento de especificación de componentes.

### 5.1 Equipo (`Tab_EQ_MaeEquipos.Estado`)

| Estado | Uso | Transiciones válidas (desde código) |
|--------|-----|-------------------------------------|
| `DISPONIBLE` | Default. Creado, devuelto, reparado | → ASIGNADO, INCIDENCIA, BAJA |
| `ASIGNADO` | Asignado a un trabajador | → DISPONIBLE, MANTENIMIENTO, BAJA, INCIDENCIA |
| `MANTENIMIENTO` | En reparación/mantenimiento | → DISPONIBLE, BAJA |
| `INCIDENCIA` | Tiene una incidencia abierta | → ASIGNADO (si sigue asignado), DISPONIBLE (si no) |
| `BAJA` | Dado de baja definitiva | → (ninguna, terminal) |

> **HECHO COMPROBADO**: No existe CHECK CONSTRAINT en BD que valide estos valores.
>
> **INFERENCIA** (confianza alta): Los valores se controlan exclusivamente desde el código.

### 5.2 Asignación (`Tab_EQ_MovEquiposAsignaciones.Estado`)

| Estado | Uso |
|--------|-----|
| `VIGENTE` | Asignación activa |
| `CESADO` | Asignación finalizada |

### 5.3 Componente (`Tab_EQ_Componentes.Estado`)

| Estado | Uso | Significado |
|--------|-----|-------------|
| `DISPONIBLE` | Default, disponible para instalar/asignar | En almacén o sin uso |
| `ASIGNADO` | Instalado en equipo O asignado a trabajador | NO COMPROBADO diferencia entre ambos |
| `BAJA` | Dado de baja definitiva | Terminal |

> **HALLAZGO**: El estado `ASIGNADO` no distingue entre "instalado en un equipo" y "asignado a un trabajador como accesorio". Esto puede generar ambigüedad en la ubicación actual del componente.

### 5.4 Incidencia (`Tab_EQ_Incidencias.Estado`)

| Estado | Uso |
|--------|-----|
| `ABIERTO` | Default al crear |
| `CERRADO` | Al cerrar la incidencia |

### 5.5 Intervención técnica (`Tab_EQ_IntervencionesTecnicas.Estado`)

| Estado | Uso |
|--------|-----|
| `REGISTRADO` | Único estado usado |

### 5.6 Movimiento equipo-componente (`Tab_EQ_MovEquiposComponentes.Estado`)

| Estado | Uso |
|--------|-----|
| `VIGENTE` | Vínculo activo (set por repositorio) |
| `BAJA` | Vínculo terminado |

> **HALLAZGO**: El DEFAULT en SQL es `'ACTIVO'`, pero el repositorio inserta explícitamente `'VIGENTE'`. Existe inconsistencia entre el default y el valor real usado.

### 5.7 Accesorio-trabajador (`Tab_EQ_MovAccesoriosTrabajador.Estado`)

| Estado | Uso |
|--------|-----|
| `VIGENTE` | Asignación activa |
| `CESADO` | Devuelto (accesorio vuelve a DISPONIBLE) |
| `BAJA` | Dado de baja |
| `PERDIDO` | Reportado como perdido |

### 5.8 Tipo de equipo / Tipo de componente (`Estado`)

| Estado | Uso |
|--------|-----|
| `ACTIVO` | Disponible para usar en nuevos registros |
| (otros o NULL) | Considerado inactivo |

### 5.9 Trabajador (`Tab_EQ_Trabajadores.Estado`)

> **NO COMPROBADO** — La validación usa `Activo VARCHAR(1)`, no el campo `Estado`.

| Estado | Uso |
|--------|-----|
| `ACTIVO` | Default |

### 5.10 Motivos de cese de asignación (enum Zod)

| Motivo | Estado resultante del equipo |
|--------|------------------------------|
| `DEVOLUCION` | DISPONIBLE |
| `RENUNCIA` | DISPONIBLE |
| `CAMBIO` | DISPONIBLE |
| `TRASLADO` | DISPONIBLE |
| `DANADO` | MANTENIMIENTO |
| `MANTENIMIENTO` | MANTENIMIENTO |
| `PERDIDO` | BAJA |
| `ROBADO` | BAJA |
| `EXTRAVIADO` | BAJA |

### 5.11 Acciones de accesorios en cese (enum Zod)

| Acción | Efecto |
|--------|--------|
| `DISPONIBLE` | Accesorio → CESADO, Componente → DISPONIBLE |
| `MANTENER` | Sin acción |
| `BAJA` | Accesorio → BAJA, Componente → BAJA |
| `PERDIDO` | Accesorio → PERDIDO, Componente → BAJA |

### 5.12 Categorías de componente (`Tab_EQ_TipodeComponentes.Categoria`)

| Categoría | Uso |
|-----------|-----|
| `REPUESTO_TECNICO` | Componente para instalación en equipos |
| `ACCESORIO` | Asignable a trabajadores |
| `CONSUMIBLE` | No implementado — recomendado para control por stock |

### 5.13 Tipos de intervención (validados en servicio)

| Tipo | Efecto secundario |
|------|-------------------|
| `MANTENIMIENTO` | Solo registro |
| `REEMPLAZO` | Instala y/o retira componentes |
| `MEJORA` | Instala y/o retira componentes |
| `REPARACION` | Solo registro |
| `DIAGNOSTICO` | Solo registro |
| `LIMPIEZA` | Solo registro |
| `INSTALACION_SO` | Solo registro |
| `BAJA_EQUIPO` | Da de baja el equipo + procesa componentes |
| `BAJA_COMPONENTE` | Da de baja un componente específico |

---

## 6. Reglas de Negocio

> **HECHO COMPROBADO** — Extraídas del código fuente de servicios y repositorios.

### 6.1 Equipos

#### Creación
- **HECHO**: Requiere `IdTipodeEquipo` válido y activo.
- **HECHO**: El tipo de equipo no puede ser uno de `TIPOS_NO_EQUIPO` ('TECLADO', 'MOUSE', 'CARGADOR', 'CABLE', 'ADAPTADOR', 'MOCHILA', 'AUDIFONOS').
- **HECHO**: `CodEquipo` debe ser único (validado en servicio, no en BD).
- **HECHO**: Si no se proporciona `CodBarra`, se auto-genera uno con formato `QR-{CodEquipo}-{timestamp}`.
- **HECHO**: El estado inicial siempre es `'DISPONIBLE'`.
- **HECHO**: Se registra un cambio de estado inicial en `Tab_EQ_MovEstadosEquipos`.

#### Actualización
- **HECHO**: No se puede editar un equipo en estado `BAJA`.
- **HECHO**: `CodEquipo` y `Estado` se eliminan del payload de actualización (no se pueden modificar).
- **HECHO**: Si se cambia `CodBarra`, se valida unicidad.

#### Baja
- **HECHO**: No se puede dar de baja un equipo ya en `BAJA`.
- **HECHO**: No se puede dar de baja un equipo con asignación activa (`Estado = 'ASIGNADO'`).
- **HECHO**: Se verifica dos veces: por `Estado` y por consulta activa al repositorio.
- **HECHO**: Se registra el cambio de estado en `Tab_EQ_MovEstadosEquipos`.

#### Cambio de estado manual
- **INFERENCIA** (confianza alta): No hay validación de transiciones permitidas — cualquier string es aceptado como `nuevoEstado`.

#### Componentes en equipo
- **HECHO**: El componente debe estar `DISPONIBLE` para instalarse.
- **HECHO**: El componente no puede estar ya instalado en el mismo equipo.
- **HECHO**: El equipo no puede estar en `BAJA`.

#### Intervenciones
- **HECHO**: No se pueden registrar intervenciones en equipos `BAJA`.
- **HECHO**: `TipoIntervencion` debe ser uno de los 9 valores válidos.
- **HECHO**: `Descripcion` es obligatoria.
- **HECHO**: Si se referencia una incidencia, debe existir y pertenecer al equipo.
- **HECHO**: Si se instala un componente, debe estar `DISPONIBLE` y no `BAJA`/`ASIGNADO`.
- **HECHO**: Si se retira un componente, debe estar asignado al equipo.
- **HECHO**: `BAJA_EQUIPO` requiere `MotivoBaja` y verifica que no haya asignación activa.
- **HECHO**: `BAJA_EQUIPO` puede procesar una lista de componentes con acciones `DISPONIBLE`, `BAJA` o `MANTENER`.

#### Características
- **HECHO**: Se requiere `IdPlantilla` por característica.
- **HECHO**: La plantilla debe pertenecer al tipo de equipo.
- **HECHO**: Operación upsert (inserta o actualiza si existe el par equipo+plantilla).
- **HECHO**: El equipo no puede estar en `BAJA`.

### 6.2 Asignaciones

#### Creación
- **HECHO**: Requiere equipo y trabajador válidos.
- **HECHO**: El equipo debe estar `DISPONIBLE` y sin incidencias abiertas.
- **HECHO**: El trabajador debe estar activo.
- **HECHO**: Es transaccional: crea asignación en `VIGENTE`, cambia equipo a `ASIGNADO`, registra estado.
- **HECHO**: Puede incluir componentes (se instalan y cambian a `ASIGNADO`).

#### Asignación múltiple
- **HECHO**: Valida todos los equipos antes de escribir (all-or-nothing).
- **HECHO**: Transaccional.

#### Asignación con accesorios
- **HECHO**: Cada accesorio debe estar `DISPONIBLE`.
- **HECHO**: Cada accesorio debe ser de categoría `ACCESORIO`.
- **HECHO**: No se permiten accesorios duplicados.
- **HECHO**: Transaccional.

#### Cese
- **HECHO**: La asignación debe estar `VIGENTE`.
- **HECHO**: El motivo determina el nuevo estado del equipo (ver tabla 5.10).
- **HECHO**: UPDATE condicional con `WHERE Estado = 'VIGENTE'` — si `rowsAffected !== 1`, error 409 (doble cese).
- **HECHO**: Transaccional.
- **HECHO**: Los accesorios vinculados se procesan según su acción:
  - `DISPONIBLE` → accesorio CESADO, componente DISPONIBLE
  - `BAJA`/`PERDIDO` → accesorio BAJA/PERDIDO, componente BAJA
  - `MANTENER` → sin cambio

#### Cese masivo por trabajador
- **HECHO**: Todas las asignaciones activas pasan a `CESADO`.
- **HECHO**: Todos los equipos involucrados pasan a `DISPONIBLE`.
- **HECHO**: Todos los accesorios del trabajador pasan a `CESADO`.
- **HECHO**: Transaccional.

### 6.3 Incidencias

#### Creación
- **HECHO**: Requiere equipo existente.
- **HECHO**: `TipoIncidencia` no tiene validación de valores permitidos.
- **HECHO**: Al crear, el equipo cambia a estado `INCIDENCIA`.
- **HECHO**: Se registra el cambio de estado en historial.
- **HECHO**: El estado de la incidencia se fija como `ABIERTO`.

#### Cierre
- **HECHO**: Requiere incidencia existente.
- **INFERENCIA** (confianza alta): No valida que la incidencia esté `ABIERTO` antes de cerrar.
- **HECHO**: Al cerrar, el equipo vuelve a `ASIGNADO` (si tiene asignación activa) o `DISPONIBLE` (si no).

### 6.4 Componentes

#### Creación
- **HECHO**: El tipo de componente debe existir.
- **HECHO**: El tipo no puede ser un equipo principal (LAPTOP, CELULAR, etc.).
- **HECHO**: Si se proporciona `Serie`, debe ser única.
- **HECHO**: Si no se proporciona `CodComponente`, se auto-genera con prefijo según tipo.
- **HECHO**: Si no se proporciona `DesComponente`, se auto-construye desde tipo + marca + modelo + capacidad.

#### Actualización
- **HECHO**: No se puede editar un componente en `BAJA`.
- **INFERENCIA** (confianza media): No se verifica unicidad de `Serie` en actualización.

#### Baja
- **HECHO**: No se puede dar de baja un componente ya en `BAJA`.
- **HECHO**: No se puede dar de baja un componente en estado `ASIGNADO`.
- **RECOMENDACIÓN**: La baja no guarda motivo, usuario ni fecha. Solo cambia el estado a `BAJA`.

### 6.5 Autenticación
- **HECHO**: Login mediante stored procedure `sp_validar_login`.
- **HECHO**: Se verifica `SwAcceso` del usuario.
- **HECHO**: Todos los intentos se registran en `Tab_SYS_LoginAudit`.
- **HECHO**: JWT expira en 8h por defecto.
- **HECHO**: Payload del JWT: `{ id, logon, nombre, rol }`.

---

## 7. Roles y Permisos

> **HECHO COMPROBADO** — Extraído de llamadas a `roleMiddleware()` en cada ruta.

### 7.1 Roles existentes

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso completo a todas las operaciones |
| `TECNICO` | Operaciones técnicas, sin permisos administrativos |

> **NO COMPROBADO**: No existen roles `SUPERVISOR` ni `ALMACEN` en el código actual.

### 7.2 Matriz de permisos

#### Equipos
| Operación | ADMIN | TECNICO |
|-----------|-------|---------|
| Leer equipos, dashboard, tipos | ✓ | ✓ |
| Crear equipo | ✓ | ✓ |
| Editar equipo | ✓ | ✓ |
| Dar de baja equipo | ✓ | ✗ |
| Crear tipo de equipo | ✓ | ✗ |
| Cambiar estado manual | ✓ | ✗ |
| Gestionar componentes del equipo | ✓ | ✓ |
| Registrar intervenciones | ✓ | ✓ |
| Leer/escribir características | ✓ | ✓ |

#### Asignaciones
| Operación | ADMIN | TECNICO |
|-----------|-------|---------|
| Leer asignaciones | ✓ | ✓ |
| Crear asignación (simple, bulk, con accesorios) | ✓ | ✓ |
| Cesar asignación individual | ✓ | ✓ |
| Cesar todas las de un trabajador | ✓ | ✗ |
| Generar acta | ✓ | ✓ |

#### Incidencias
| Operación | ADMIN | TECNICO |
|-----------|-------|---------|
| Leer incidencias | ✓ | ✓ |
| Crear incidencia | ✓ | ✓ |
| Cerrar incidencia | ✓ | ✓ |

#### Componentes
| Operación | ADMIN | TECNICO |
|-----------|-------|---------|
| Leer componentes, tipos | ✓ | ✓ |
| Crear componente | ✓ | ✓ |
| Editar componente | ✓ | ✓ |
| Dar de baja componente | ✓ | ✓ |
| Crear tipo de componente | ✓ | ✗ |

#### Trabajadores
| Operación | ADMIN | TECNICO |
|-----------|-------|---------|
| Leer trabajadores | ✓ | ✓ |
| Sincronizar desde RRHH | ✓ | ✗ |

#### Auth
| Operación | ADMIN | TECNICO |
|-----------|-------|---------|
| Login | ✓ | ✓ |
| Ver perfil propio | ✓ | ✓ |
| Ver auditoría de login | ✓ | ✗ |

> **RECOMENDACIÓN**: La autorización real debe aplicarse en el backend, no solo ocultando botones en el frontend. Actualmente esto se cumple (toda mutación tiene `roleMiddleware`).

---

## 8. Flujos de Módulos

> **HECHO COMPROBADO** — Extraído de la lógica de servicios. Algunos pasos son inferencia cuando el código no es explícito.

### 8.1 Equipo — Ciclo de vida completo

```
1. CREACIÓN
   └─ Se registra el equipo con estado DISPONIBLE
   └─ Se genera código interno (auto o manual)
   └─ Se genera código QR
   └─ Se registra estado inicial en historial

2. ASIGNACIÓN
   └─ Se verifica: equipo DISPONIBLE, sin incidencias abiertas
   └─ Se verifica: trabajador activo
   └─ Se crea asignación (VIGENTE)
   └─ Equipo → ASIGNADO
   └─ (Opcional) Componentes → ASIGNADOS
   └─ (Opcional) Accesorios → ASIGNADOS al trabajador

3. USO / INCIDENCIA
   └─ Se reporta incidencia
   └─ Equipo → INCIDENCIA (si estaba ASIGNADO o DISPONIBLE)
   └─ Se asigna técnico (NO COMPROBADO — no hay campo en el modelo)
   └─ Se resuelve → cierre de incidencia
   └─ Equipo → ASIGNADO (si sigue asignado) o DISPONIBLE (si no)

4. INTERVENCIÓN TÉCNICA
   └─ Puede ocurrir durante incidencia o programada
   └─ Registra mantenimiento, reparación, reemplazo, etc.
   └─ Puede instalar/retirar componentes
   └─ No cambia estado del equipo (excepto BAJA_EQUIPO)

5. CESE DE ASIGNACIÓN
   └─ Según motivo:
        Devolución normal → DISPONIBLE
        Dañado → MANTENIMIENTO
        Perdido/Robado → BAJA
   └─ Asignación → CESADO

6. REASIGNACIÓN
   └─ Si quedó DISPONIBLE → puede asignarse a otro trabajador

7. BAJA (terminal)
   └─ Equipo → BAJA
   └─ No puede ocurrir si tiene asignación activa
```

### 8.2 Componente — Ciclo de vida

```
1. REGISTRO
   └─ Se registra con estado DISPONIBLE
   └─ Código auto-generado según tipo

2. INSTALACIÓN EN EQUIPO (repuestos técnicos)
   └─ Componente → ASIGNADO
   └─ Se crea vínculo en Tab_EQ_MovEquiposComponentes (VIGENTE)
   └─ Se asocia a intervención (opcional)

3. RETIRO DE EQUIPO
   └─ Se cierra vínculo
   └─ Componente → DISPONIBLE o BAJA según resultado

4. ASIGNACIÓN A TRABAJADOR (accesorios)
   └─ Componente → ASIGNADO
   └─ Se crea vínculo en Tab_EQ_MovAccesoriosTrabajador (VIGENTE)
   └─ Solo para categoría ACCESORIO

5. DEVOLUCIÓN DE TRABAJADOR
   └─ Componente → DISPONIBLE (o BAJA si dañado/perdido)

6. BAJA (terminal)
   └─ Componente → BAJA
   └─ No puede ocurrir si está ASIGNADO
   └─ NO COMPROBADO: No se guarda motivo, usuario ni fecha de baja
```

### 8.3 Incidencia — Ciclo

```
1. REPORTE
   └─ Se crea incidencia (Estado = ABIERTO)
   └─ Equipo → INCIDENCIA
   └─ Se registra tipo, descripción, equipo, quién reporta

2. CIERRE
   └─ Se cierra incidencia (Estado = CERRADO)
   └─ Equipo → ASIGNADO (si tiene asignación activa) o DISPONIBLE
```

> **NO COMPROBADO**: No existe el concepto de "asignar técnico" ni "en proceso" en el modelo actual.

### 8.4 Intervención técnica

```
1. REGISTRO
   └─ Se crea intervención (Estado = REGISTRADO)
   └─ Tipo: MANTENIMIENTO, REEMPLAZO, REPARACION, etc.
   └─ Puede vincularse a una incidencia
   └─ Puede instalar y/o retirar componentes

2. EFECTOS SEGÚN TIPO
   └─ REEMPLAZO/MEJORA: instala y retira componentes
   └─ BAJA_EQUIPO: da de baja el equipo
   └─ BAJA_COMPONENTE: da de baja el componente
   └─ Otros: solo registro, sin efectos secundarios
```

---

## 9. API — Contratos

> **HECHO COMPROBADO** — Verificado en archivos de rutas y servicios.

### 9.1 Formato de respuesta

**Éxito:**
```json
{
  "id": 123,
  "message": "Operación exitosa"
}
```
o directamente el array/objeto solicitado.

**Error:**
```json
{
  "error": "Mensaje de error"
}
```

**Error de validación (Zod):**
```json
{
  "error": [
    { "campo": "Motivo", "mensaje": "Required" }
  ]
}
```

### 9.2 Códigos HTTP

| Código | Uso |
|--------|-----|
| 200 | Éxito |
| 201 | Creación (no siempre usado) |
| 400 | Validación fallida, regla de negocio |
| 401 | Token inválido/ausente |
| 403 | Rol sin permiso |
| 404 | Recurso no encontrado |
| 409 | Conflicto (doble cese, concurrencia) |
| 500 | Error interno (mensaje genérico en producción) |

### 9.3 Paginación

**Request:**
```
GET /api/equipos?page=1&pageSize=25&estado=DISPONIBLE&search=laptop
```

**Response:**
```json
{
  "rows": [],
  "total": 200,
  "page": 1,
  "pageSize": 25,
  "totalPages": 8
}
```

> **HECHO COMPROBADO**: Aplicado en equipos, trabajadores y asignaciones.

### 9.4 Endpoints completos

> Ver [sección 6 del README principal](./README.md#6-api--endpoints) para el listado completo.

---

## 10. Convenciones del Proyecto

> **HECHO COMPROBADO** — Extraídas de la estructura de código existente.

### 10.1 Backend

| Convención | Regla |
|------------|-------|
| **Módulos ES** | `"type": "module"` en package.json |
| **Arquitectura** | Route → Service → Repository |
| **Archivos de ruta** | `src/routes/{recurso}.routes.js` |
| **Archivos de servicio** | `src/services/{recurso}.service.js` |
| **Archivos de repositorio** | `src/repositories/{recurso}.repository.js` |
| **Nombres de exportación** | `EquiposService`, `AsignacionesRepository` (PascalCase) |
| **Nombres de funciones** | `camelCase` |
| **Nombres SQL** | `PascalCase` con prefijo de tabla (IdMaeEquipo, CodEquipo) |
| **Validación** | Zod schemas en `middleware/validators.js` |
| **Base de datos** | `const DB = 'InventarioGP'` en cada repositorio |
| **Transacciones** | `withTransaction(DB, async (trx) => { ... })` desde `db.js` |
| **Helper transaccional** | `trxExec(trx, sql, params)` y `trxRows(trx, sql, params)` |
| **Errores de negocio** | `businessError(message, statusCode)` o `Error` directo |
| **Puerto** | 3001 por defecto |
| **Prefijos BD** | `Tab_EQ_` para tablas del módulo |

### 10.2 Frontend

| Convención | Regla |
|------------|-------|
| **Componentes** | Functional components + hooks |
| **Archivos de página** | `src/pages/{Nombre}.jsx` (PascalCase) |
| **Archivos de componente** | `src/components/{Nombre}.jsx` |
| **Componentes de dominio** | `src/components/{recurso}/{Nombre}.jsx` |
| **UI primitivas** | `src/components/ui/{nombre}.jsx` (shadcn, kebab-case) |
| **Hooks personalizados** | `src/hooks/` (si existieran) |
| **API client** | `src/lib/api.js` — métodos agrupados por recurso |
| **Utilidades** | `src/lib/utils.js` — `cn()`, `formatDate()`, `estadoColor()` |
| **Contexto** | `src/context/AuthContext.jsx` |
| **Rutas** | Definidas en `App.jsx` con `react-router-dom` |
| **Estado servidor** | `@tanstack/react-query` con `queryKey` por recurso |
| **Estilos** | Tailwind CSS 4 con `cn()` para merge condicional |
| **Iconos** | `lucide-react` |
| **Alertas** | `sweetalert2` |
| **Importaciones** | `#components/ui/{nombre}.jsx` (alias configurado) |

### 10.3 API

| Convención | Regla |
|------------|-------|
| **Formato** | RESTful, JSON |
| **Autenticación** | `Authorization: Bearer <token>` |
| **Prefijo** | `/api/{recurso}` |
| **Verbos** | GET (leer), POST (crear), PUT (reemplazar), PATCH (parcial), DELETE (eliminar) |
| **Paginación** | Query params: `page`, `pageSize`. Response: `{ rows, total, page, pageSize, totalPages }` |
| **Errores** | Código HTTP + `{ error: mensaje }` o `{ error: [{ campo, mensaje }] }` |

### 10.4 Base de datos

| Convención | Regla |
|------------|-------|
| **Nombres de tabla** | `Tab_EQ_{Nombre}` (PascalCase) |
| **Prefijo módulo** | `EQ` = Equipos |
| **PK** | `Id{NombreTabla}` INT IDENTITY |
| **FK** | Mismo nombre que la columna referenciada |
| **Fechas** | `DATETIME` para precisión, `DATE` donde solo importa la fecha |
| **Auditoría** | `IdUsuarioCrea`, `FecCreacion`, `IdUsuarioModifica`, `FecModificacion` |

---

## 11. Decisiones de Arquitectura (ADR)

### ADR-001: Routes → Services → Repositories

**Contexto**: Separación clara de responsabilidades.
**Decisión**: Routes validan input y auth, Services aplican reglas de negocio, Repositories ejecutan SQL.
**Consecuencia**: Los tests pueden mockear repositorios, los servicios son independientes de Express.

### ADR-002: mssql directo, no ORM

**Contexto**: BD existente con esquema predefinido.
**Decisión**: Usar `mssql` con consultas SQL directas. No usar Sequelize, TypeORM ni Prisma.
**Consecuencia**: Control total sobre SQL, pero más código boilerplate.

### ADR-003: Transacciones manuales con withTransaction

**Contexto**: Operaciones multi-tabla requieren atomicidad.
**Decisión**: Función `withTransaction` en `db.js` que maneja begin/commit/rollback.
**Consecuencia**: Consistencia en operaciones críticas (asignación, cese, baja).

### ADR-004: Zod para validación, no class-validator ni Joi

**Contexto**: Necesidad de validar schemas en el middleware.
**Decisión**: Zod por su tipado, tamaño y facilidad de composición.
**Consecuencia**: Schemas reutilizables, mensajes de error claros.

### ADR-005: JWT con payload mínimo

**Contexto**: Autenticación stateless.
**Decisión**: JWT con `{ id, logon, nombre, rol }`, expiración 8h.
**Consecuencia**: No requiere sesión en servidor, fácil de escalar.

### ADR-006: catch(404) en lugar de validar existencia manual

**Contexto**: Algunas rutas combinan validación de existencia + permisos.
**Decisión**: Cada servicio verifica existencia del recurso y lanza error 404 si no existe.
**Consecuencia**: Código explícito, evita errores crípticos.

---

## 12. Roadmap

> **NO COMPROBADO** — No existe documentación oficial de estado del proyecto. Esta es una evaluación basada en el código actual.

### Evaluación actual del código

| Módulo | Estado | Observaciones |
|--------|--------|---------------|
| **Login/Auth** | ✅ Completo | Login, JWT, roles, audit |
| **Equipos** | 🟡 Operativo | CRUD completo, faltan constraints BD y validación de transiciones de estado |
| **Trabajadores** | ✅ Completo | CRUD + sync + stats |
| **Asignaciones** | 🟡 Operativo | CRUD completo, cese con motivos controlados, acta PDF |
| **Incidencias** | 🟡 Básico | Crear/cerrar, falta estado "en proceso", asignación a técnico |
| **Componentes** | 🔴 Limitado | CRUD básico, sin diferenciación INSTALADO_EQUIPO vs ASIGNADO_TRABAJADOR, baja sin auditoría |
| **Intervenciones** | 🟡 Básico | CRUD, limitado a 1 componente instalado + 1 retirado |
| **Dashboard** | 🟢 Básico | Stats + gráficos, datos en tiempo real |
| **QR** | ✅ Completo | Generación + escaneo |
| **Acta PDF** | 🟡 Básico | HTML renderizado, descargable |

### Leyenda
| Icono | Significado |
|-------|-------------|
| ✅ | Funcional, sin deuda técnica crítica |
| 🟢 | Funcional básico, mejorable |
| 🟡 | Operativo pero con limitaciones conocidas |
| 🔴 | Limitado, requiere refactor |

---

## Apéndice A: Errores y hallazgos en la base actual

> **HECHO COMPROBADO** — Verificado en código y SQL.

| # | Hallazgo | Severidad | Archivo/Línea |
|---|----------|-----------|---------------|
| 1 | `create_core_tables.sql` línea 132: `DEFAULT GETDATE(),cua` — error de sintaxis | Media | `create_core_tables.sql:132` |
| 2 | `Tab_EQ_MovEquiposComponentes.Estado` DEFAULT es `'ACTIVO'` pero el código usa `'VIGENTE'` | Baja | SQL vs `componentes.repository.js` |
| 3 | `Tab_EQ_Componentes` no tiene UNIQUE sobre `CodComponente` ni `Serie` | Alta | Solo se valida en servicio |
| 4 | `Tab_EQ_MaeEquipos` no tiene UNIQUE sobre `CodEquipo` ni `CodBarra` | Alta | Solo se valida en servicio |
| 5 | Baja de componente no guarda motivo, usuario ni fecha | Alta | `componentes.service.js:baja()` |
| 6 | Incidencias no validan estado `ABIERTO` antes de cerrar | Media | `incidencias.service.js:cerrar()` |
| 7 | `cambiarEstado` de equipo acepta cualquier string sin validar transiciones | Media | `equipos.service.js:cambiarEstado()` |
| 8 | No existe restricción CHECK de estados válidos en BD | Media | Ninguna tabla tiene CHECK |
| 9 | `Activo` en `Tab_EQ_Trabajadores` es VARCHAR(1) en vez de BIT | Baja | `trabajadores.repository.js` |

---

## Apéndice B: Cómo contribuir / modificar este documento

1. Todo cambio debe reflejarse también en el código (DRY entre documentación e implementación).
2. Las reglas de negocio se actualizan cuando se modifica un service.
3. Los estados se actualizan cuando se modifica un validador.
4. La matriz de permisos se actualiza cuando se modifica una ruta.
5. Marcar explícitamente cambios como "HECHO COMPROBADO", "INFERENCIA" o "RECOMENDACIÓN".
