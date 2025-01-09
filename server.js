// using Express
const express = require('express');
const pg = require('pg');
const app = express();

// set up port
const port = process.env.PORT || 3000;

const categoryRouter = require('./routes/category');
const budgetRouter = require('./routes/budget');
const expenseRouter = require('./routes/expense');
const analysisRouter = require('./routes/analysis');

// parse json
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use('/category', categoryRouter);
app.use('/budget', budgetRouter);
app.use('/expense', expenseRouter);
app.use('/analysis', analysisRouter);

// start up server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });