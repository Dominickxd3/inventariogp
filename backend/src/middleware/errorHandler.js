const SQL_PATTERNS = [
  'Invalid column name', 'Invalid object name', 'Invalid table name',
  'Cannot insert duplicate key', 'Violation of PRIMARY KEY',
  'Could not find', 'Incorrect syntax near', 'SQL',
];

function esErrorSQL(err) {
  return !!(
    err.originalError ||
    err.number ||
    (err.name && err.name.includes('RequestError')) ||
    SQL_PATTERNS.some(p => (err.message || '').includes(p))
  );
}

export function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Siempre loguear el error internamente
  console.error(`[ERROR] ${err.message}`, isDev ? err.stack : '');

  // Errores SQL: nunca exponer detalles
  if (esErrorSQL(err)) {
    return res.status(500).json({ error: 'No se pudo completar la operación.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const response = { error: err.message || 'Error interno del servidor' };

  // En producción, los errores 500 no exponen el mensaje real
  if (!isDev && statusCode === 500) {
    response.error = 'Error interno del servidor';
  }

  res.status(statusCode).json(response);
}
