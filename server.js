const express = require('express');
const app = express();
const pool = require('./db'); // Ensure the correct path to db.js

// Set up port
const port = process.env.PORT || 3000;

// Parse JSON
app.use(express.json());

// Import and use admin routes
const adminRouter = require('./admin.js');
app.use('/admin', adminRouter);

app.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = 'SELECT * FROM public.appuser'; // Adjust the query to match your table
    const result = await client.query(query);
    client.release();

    res.status(200).json(result.rows); // Send the data as JSON response
  } catch (error) {
    console.error('Error executing query', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start up server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});