const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '185.199.53.201',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'Madhura',
    password: process.env.DB_PASSWORD || 'Madhura2026',
    database: process.env.DB_NAME || 'madhurahrms',
    waitForConnections: true,
    connectionLimit: 15,
    maxIdle: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 2000,
    connectTimeout: 30000,
    idleTimeout: 60000
});

pool.on('error', (err) => {
  console.error('[MySQL Pool Error]', err.message || err);
});

// Export a wrapper that mimics the single connection interface but uses the pool with auto-retry resilience
const db = {
  pool,
  query: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    const executeQuery = (retriesLeft) => {
      pool.query(sql, params, (err, results, fields) => {
        const isRetryable = err && ['ETIMEDOUT', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'EHOSTUNREACH', 'ECONNREFUSED'].includes(err.code);
        if (isRetryable && retriesLeft > 0) {
          console.warn(`[DB WARN] ${err.code} on DB query, retrying connection in 1000ms... (${retriesLeft} retry left)`);
          setTimeout(() => executeQuery(retriesLeft - 1), 1000);
        } else {
          if (callback) callback(err, results, fields);
        }
      });
    };

    return executeQuery(2);
  },
  getConnection: (callback) => {
    return pool.getConnection(callback);
  },
  withTransaction: async (workFn) => {
    const promisePool = pool.promise();
    let conn;
    let retries = 2;
    while (retries > 0) {
      try {
        conn = await promisePool.getConnection();
        break;
      } catch (connErr) {
        retries--;
        if (retries === 0) throw connErr;
        console.warn(`[DB WARN] Connection pool timeout, retrying in 500ms...`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
    await conn.beginTransaction();
    try {
      const result = await workFn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
  beginTransaction: (callback) => {
    if (typeof callback === 'function') callback(null);
    return Promise.resolve();
  },
  commit: (callback) => {
    if (typeof callback === 'function') callback(null);
    return Promise.resolve();
  },
  rollback: (callback) => {
    if (typeof callback === 'function') callback();
    return Promise.resolve();
  },
  connect: (callback) => {
    if (typeof callback === 'function') callback(null);
  }
};

module.exports = db;