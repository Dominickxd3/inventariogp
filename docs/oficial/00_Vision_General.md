# 00 — Visión General

> **Propósito**: Este documento describe el propósito, alcance y contexto del sistema InventarioGP.
> **Audiencia**: Nuevos desarrolladores, stakeholders, equipo de operaciones.
> **Estado**: ✅ Completo

---

## ¿Qué es InventarioGP?

Sistema web interno del área de sistemas de **Grupo Pecuario** para administrar el ciclo de vida completo de activos tecnológicos: equipos de cómputo, componentes, accesorios, asignaciones a trabajadores, incidencias e intervenciones técnicas.

## ¿Qué problema resuelve?

Controlar el inventario tecnológico de la organización, que incluye:

- **Equipos**: laptops, PCs de escritorio, monitores, impresoras, celulares, tablets, switches, access points.
- **Componentes**: repuestos técnicos (RAM, SSD, HDD) y accesorios (teclados, mouse, cargadores).
- **Asignaciones**: qué equipo tiene cada trabajador, desde cuándo, y por qué se devolvió.
- **Incidencias**: fallas reportadas sobre equipos y su resolución.
- **Intervenciones**: mantenimientos, reparaciones y reemplazos realizados.

Sin el sistema, no hay forma confiable de saber quién tiene qué equipo, dónde está cada componente, o qué intervenciones recibió un equipo.

## ¿Quiénes lo usan?

| Rol | Uso principal |
|-----|--------------|
| **ADMIN** | Gestión completa del inventario, altas, bajas, sincronización con RRHH, reportes |
| **TECNICO** | Operaciones diarias: asignar equipos, registrar incidencias, realizar intervenciones |

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js 24, Express 4 |
| Base de datos | SQL Server 2019+ |
| Autenticación | JWT (8h expiración) |
| HTTP Client | @tanstack/react-query 5 |
| Tablas | @tanstack/react-table 8 |
| QR | qrcode.react + html5-qrcode |

## ¿Qué NO hace el sistema?

- No gestiona consumibles por stock (tóner, pilas, cables genéricos) — pendiente de desarrollo.
- No tiene integración con proveedores ni órdenes de compra.
- No tiene módulo de garantías automatizado.
- No tiene app móvil nativa (el escáner QR es web).

## Módulos del sistema

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Login/Auth | ✅ | Autenticación JWT, roles, auditoría de intentos |
| Equipos | 🟡 | CRUD completo, tipos, características, QR, timeline |
| Trabajadores | ✅ | Directorio sincronizado desde RRHH, estadísticas |
| Asignaciones | 🟡 | Asignación simple/múltiple/con accesorios, cese por motivo, acta PDF |
| Incidencias | 🟡 | Crear/cerrar con cambio de estado automático del equipo |
| Componentes | 🔴 | CRUD básico, sin trazabilidad completa de movimientos |
| Intervenciones | 🟡 | CRUD, limitado a 1 componente instalado + 1 retirado |
| Dashboard | 🟢 | Estadísticas y gráficos en tiempo real |

## Convención de etiquetas en documentos

| Etiqueta | Significado |
|----------|-------------|
| ✅ HECHO COMPROBADO | Verificado en código, BD o documentación |
| 🔍 INFERENCIA | Conclusión lógica basada en evidencia |
| 💡 RECOMENDACIÓN | Mejora propuesta, no implementada |
| ❌ NO COMPROBADO | No se pudo verificar con la información disponible |
