require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const poolConfig = {
  min: 0,
  max: 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 60000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '185.199.53.201',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'Madhura',
      password: process.env.DB_PASSWORD || 'Madhura2026',
      database: process.env.DB_NAME || 'madhurahrms',
      connectTimeout: 60000,
      enableKeepAlive: true
    },
    pool: poolConfig,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    }
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '185.199.53.201',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'Madhura',
      password: process.env.DB_PASSWORD || 'Madhura2026',
      database: process.env.DB_NAME || 'madhurahrms',
      connectTimeout: 60000,
      enableKeepAlive: true
    },
    pool: poolConfig,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    }
  }
};
