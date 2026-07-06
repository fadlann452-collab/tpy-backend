const { Pool } = require('pg');
require('dotenv').config();

const isNeonHost = (process.env.DB_HOST || '').includes('neon.tech');
const useSSL = process.env.DB_SSL === 'true' || isNeonHost;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err.message);
});

module.exports = pool;