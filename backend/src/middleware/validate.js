/**
 * Middleware de validación con Zod.
 * Uso: router.post('/', validate(loginSchema), handler)
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }));
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Valida parámetros de ruta con Zod.
 * Uso: router.get('/:id', validateParams(idParamSchema), handler)
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }));
      return res.status(400).json({ error: 'Parámetros inválidos', detalles: errors });
    }
    req.params = result.data;
    next();
  };
}
