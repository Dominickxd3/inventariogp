const SQL_PATTERNS = [
  'Invalid column name', 'Invalid object name', 'Invalid table name',
  'Cannot insert duplicate key', 'Violation of PRIMARY KEY',
  'Could not find', 'Incorrect syntax near', 'SQL',
  'intermediate value is not iterable', 'Cannot read properties of undefined',
  'Cannot destructure property', 'is not iterable',
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
  console.error(`[ERROR] ${err.message}`);
  if (err.stack) console.error(err.stack);

  if (esErrorSQL(err)) {
    return res.status(500).json({ error: 'No se pudo completar la operación.' });
  }

  const statusCode = err.statusCode || err.status || (err.message?.includes('no encontrado') ? 404 : 500);
  res.status(statusCode).json({ error: err.message || 'Error interno del servidor' });
}
