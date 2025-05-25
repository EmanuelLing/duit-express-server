require('dotenv').config(); // Load environment variables
const pg = require('pg');

const pool = new pg.Pool({
    host: process.env.DB_HOS,
    database: process.env.DB_NAME,
    user:  process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true

});

module.exports = pool;