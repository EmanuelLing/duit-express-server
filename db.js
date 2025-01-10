const { Pool } = require('pg');

const pool = new Pool({
  host: 'duitappworkshop2.postgres.database.azure.com',
  database: 'postgres',
  user: 'duit_admin',
  password: '@Bcd1234',
  port: 5432, // Default PostgreSQL port
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;