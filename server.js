// using Express
const express = require('express');
const pg = require('pg');
const app = express();
const cors = require('cors');


// set up port
const port = process.env.PORT || 3000;

const adminRouter = require('./routes/admin.js');
const notificationRouter = require('./routes/notification.js');
const categoryRouter = require('./routes/category');
const budgetRouter = require('./routes/budget');
const expenseRouter = require('./routes/expense');
const analysisRouter = require('./routes/analysis');

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


// Log request size
app.use((req, res, next) => {
  console.log(`Payload size: ${req.headers['content-length']} bytes`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, world!');
});


app.use('/admin',adminRouter);
app.use('/notification',notificationRouter);
app.use('/category', categoryRouter);
app.use('/budget', budgetRouter);
app.use('/expense', expenseRouter);
app.use('/analysis', analysisRouter);

// start up server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });