// using Express
const express = require('express');
const pg = require('pg');
const app = express();
const cors = require('cors');


// set up port
const port = process.env.PORT || 3000;
const basic_categories = require('./routes/categories.js');
const income_categories_router = require('./routes/incomeCategories');
const income_router = require('./routes/income');
const ExpenseListRouter = require('./routes/expense.js');
const icons_router = require('./routes/icons.js'); 
const subcategories_router = require('./routes/subcategories.js');
const transactionList_router = require('./routes/transactions.js');

const adminRouter = require('./routes/admin.js');
const notificationRouter = require('./routes/notification.js');
const categoryRouter = require('./routes/category.js');
const budgetRouter = require('./routes/budget.js');
const expenseRouter = require('./routes/expense.js');
const analysisRouter = require('./routes/analysis.js');
const appuserRouter = require('./routes/appuser.js');
const authRouter = require('./routes/auth.js');
const changeEmailRouter = require('./routes/changeEmail.js');
const profileRouter = require('./routes/profile.js');
const userRouter = require('./routes/user.js');

const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
};

app.use(cors(corsOptions));

// parse json
// Increase payload size limit to 10MB
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


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


app.use('/admin',adminRouter);
app.use('/notification',notificationRouter);
app.use('/category', categoryRouter);
app.use('/budget', budgetRouter);
app.use('/expense', expenseRouter);
app.use('/analysis', analysisRouter);
app.use('/appuser', appuserRouter);
app.use('/auth', authRouter);
app.use('/changeEmail', changeEmailRouter);
app.use('/profile', profileRouter);
app.use('/user', userRouter);

// start up server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });