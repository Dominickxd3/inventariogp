# ADR-002: Trazabilidad de Operaciones mediante Auditoría Explícita

**Estado:** ✅ Aceptado
**Fecha:** 2026-07-20
**Contexto:** Se necesita registrar quién hace qué en el sistema, especialmente en operaciones críticas como asignaciones, ceses y cambios de estado.

## Decisión

Se implementó una tabla `EQ_Auditoria` donde los **services** insertan registros de auditoría explícitamente después de cada operación. No se usan triggers de base de datos.

```sql
INSERT INTO EQ_Auditoria (Tabla, Operacion, IdRegistro, ValoresAnteriores, ValoresNuevos, IdUsuario)
VALUES ('EQ_Asignaciones', 'CESAR', @IdAsignacion, @beforeJson, @afterJson, @IdUsuario)
```

## Consecuencias

- **Positivas**: control total sobre qué se audita, los servicios pueden enriquecer el log con contexto de negocio
- **Negativas**: cada service debe acordarse de auditar (riesgo de omisión), no hay auditoría automática de lecturas ni de operaciones no consideradas

## Alternativas descartadas

- **Triggers de BD**: difíciles de mantener, lógica de negocio duplicada, problemas con transacciones
- **Proxy de base de datos**: sobreingeniería para el tamaño del proyecto

## 💡 Recomendación futura

Considerar un **service wrapper** o **middleware post-operación** que audite automáticamente según una configuración por tabla/operación, para reducir el riesgo de omisión.
