# ADR-001: Arquitectura de Capas con Rutas → Servicios → Repositorios

**Estado:** ✅ Aceptado
**Fecha:** 2026-07-20
**Contexto:** Se necesita una arquitectura limpia y mantenible para un sistema que crecerá en funcionalidades.

## Decisión

Se adoptó una arquitectura de 3 capas en el backend:

```
Routes → define endpoints, aplica middleware, llama servicios
Services → contiene toda la lógica de negocio, orquesta repositorios, maneja transacciones
Repositories → ejecuta SQL directo contra SQL Server
```

Se descartó explícitamente el patrón Controller separado — las rutas cumplen ese rol.

## Consecuencias

- **Positivas**: separación clara de responsabilidades, servicios reutilizables, fácil testear cada capa
- **Negativas**: más archivos que un enfoque monolítico, overhead para operaciones simples

## Alternativas consideradas

- **Controllers separados**: más boilerplate, beneficio marginal para el tamaño del proyecto
- **SQL en línea en rutas**: no escalable, imposible testear
- **ORM (Prisma/TypeORM)**: no se consideró — se prefiere control total sobre SQL y compatibilidad con SQL Server
