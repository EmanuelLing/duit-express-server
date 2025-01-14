// using Express
const express = require('express');
const pg = require('pg');
const app = express();

// set up port
const port = process.env.PORT || 3000;
const basic_categories = require('./routes/categories.js');
const income_categories_router = require('./routes/incomeCategories');
const income_router = require('./routes/income');
const ExpenseListRouter = require('./routes/expense.js');
const icons_router = require('./routes/icons.js'); 
const subcategories_router = require('./routes/subcategories.js');
const transactionList_router = require('./routes/transactions.js');

// parse json
app.use(express.json());

app.use('/categories',basic_categories);
app.use('/incomeCategories',income_categories_router);
app.use('/income',income_router);
app.use('/expense',ExpenseListRouter);
app.use('/icons', icons_router); 
app.use('/subcategories',subcategories_router);
app.use('/transactions', transactionList_router);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// start up server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });