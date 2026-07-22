# ADR-003: Uso de Zod para Validación Rígida en Backend

**Estado:** ✅ Aceptado
**Fecha:** 2026-07-20
**Contexto:** Se necesita validar datos de entrada de forma consistente sin añadir complejidad.

## Decisión

Se usa **Zod** como biblioteca de validación de esquemas. Cada operación define su esquema en `validators.js` y cualquier request que no cumpla es rechazado con 400.

```javascript
export const asignacionCesarSchema = {
  body: z.object({
    MotivoCese: z.enum([...9 motivos...]),
    Obs: z.string().min(1).max(500),
    accesorios: z.array(z.object({
      idMovAccesorio: z.number(),
      accion: z.enum(['ASIGNADO', 'INSTALADO'])
    })).optional()
  })
};
```

## Consecuencias

- **Positivas**:
  - Validación en un solo lugar (no duplicada en service/repository)
  - Tipos seguros (Zod infiere types)
  - Mensajes de error descriptivos
  - Fácil de leer y modificar
- **Negativas**:
  - Esquemas se alargan con objetos complejos
  - No hay validación cruzada entre body y params

## Alternativas descartadas

- **Joi**: más verboso, menos integración con inferencia de tipos
- **express-validator**: too flexible, validaciones inline en rutas
- **Validación manual en services**: código repetitivo, propenso a errores
- **Validación solo en frontend**: riesgo de seguridad

