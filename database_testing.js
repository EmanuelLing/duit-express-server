const pool = require('./db'); // Assuming db.js is in the same directory

const query_string = "SELECT NOW();"

pool.query(query_string, (error, result) => {
  if (error) {
    console.error('Error executing query:', error);
  } else {
    console.log('Result:', result);
  }
});