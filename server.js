// using Express
const express = require('express');
const pg = require('pg');
const app = express();

// set up port
const port = process.env.PORT || 3000;

// parse json
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// start up server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });