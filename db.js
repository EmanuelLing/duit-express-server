const pg = require('pg');

const pool = new pg.Pool({
    host: 'duitappworkshop2.postgres.database.azure.com',
    database: 'postgres',
    user: 'duit_admin',
    password: '@Bcd1234',
    port: 5432, // Default PostgreSQL port  
    ssl: true

});

module.exports = pool;