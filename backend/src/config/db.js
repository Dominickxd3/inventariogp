import sql from 'mssql';
import { config as appConfig } from './index.js';

const poolCache = new Map();

async function getPool(dbName) {
  if (poolCache.has(dbName)) {
    const p = poolCache.get(dbName);
    if (p.connected) return p;
  }
  const pool = new sql.ConnectionPool({
    server: appConfig.db.server,
    user: appConfig.db.user,
    password: appConfig.db.password,
    database: dbName,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  });
  await pool.connect();
  poolCache.set(dbName, pool);
  return pool;
}

export async function query(dbName, sqlQuery, params = {}) {
  const pool = await getPool(dbName);
  const request = pool.request();
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });
  const result = await request.query(sqlQuery);
  return result.recordset ? Array.from(result.recordset) : [];
}

export async function execute(dbName, procedure, params = {}) {
  const pool = await getPool(dbName);
  const request = pool.request();
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });
  const result = await request.execute(procedure);
  return result.recordset || [];
}

export async function withTransaction(dbName, callback) {
  const pool = await getPool(dbName);
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export function createRequest(transaction, params = {}) {
  const request = transaction.request();
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });
  return request;
}

export async function closeAll() {
  for (const pool of poolCache.values()) {
    try { await pool.close(); } catch {}
  }
  poolCache.clear();
}

export { sql };
