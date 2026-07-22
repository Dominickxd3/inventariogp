# 00 — Visión General

> **Propósito**: Propósito, alcance y contexto del sistema InventarioGP.
> **Estado**: ⚠️ BORRADOR — PENDIENTE DE VALIDACIÓN

---

## ¿Qué es InventarioGP?

Sistema web interno del área de sistemas de **Grupo Pecuario** para administrar el ciclo de vida completo de activos tecnológicos.

## Stack tecnológico

| Capa | Tecnología | Verificación |
|------|-----------|-------------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, shadcn/ui | Verificado en package.json |
| Backend | Node.js 24, Express 4, ES Modules | Verificado en package.json (type: module) |
| BD | SQL Server 2019+ | Confirmado por infraestructura |
| HTTP Client | fetch() nativo | Verificado en frontend/src/lib/api.js |
| Data Fetching | @tanstack/react-query 5 | Verificado en package.json |
| Tablas | @tanstack/react-table 8 | Verificado en package.json |
| QR | qrcode.react + html5-qrcode | Verificado en package.json |
| Autenticación | JWT (8h expiración) | Verificado en config/index.js |
| Hash | bcrypt | Verificado en package.json ("bcrypt": "^6.0.0") |
| Validación | Zod | Verificado en package.json |

## Módulos del sistema

| Módulo | Estado | Notas |
|--------|--------|-------|
| Login/Auth | ✅ Operativo | JWT, roles ADMIN/TECNICO, auditoría de login en Tab_EQ_LoginAudit |
| Equipos | ✅ Operativo | CRUD, estados, QR, dashboard, características técnicas |
| Trabajadores | ✅ Operativo | Sincronización con ERP, estadísticas, búsqueda |
| Asignaciones | ✅ Operativo | Asignación simple/múltiple/con accesorios, cese por motivo, acta HTML |
| Incidencias | ✅ Operativo | CRUD, apertura/cierre |
| Intervenciones | 🟡 Sin ruta propia | Solo repositorio; invocado desde EquiposService |
| Componentes | 🟡 Funcional | CRUD, sin trazabilidad de estados, baja sin motivo |
| Dashboard | 🟡 Sin endpoint dedicado | Métricas desde EquiposRepository.getDashboardStats() |

## Infraestructura confirmada

- Monolito desplegado en Windows Server
- SQL Server con base InventarioGP
- ERP conectado mediante Linked Server (nombre y configuración: PENDIENTE DE VALIDACIÓN)
- Firewall perimetral FortiGate (reglas: PENDIENTE DE VALIDACIÓN)
