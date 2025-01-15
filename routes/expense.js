const express = require('express'); // to create a web server and manage routing
const expenseRouter = express.Router(); // a router instance to handle routes specific to insight.
// Modularizes the code, making it more maintainable

// database connection
const db = require('./../db');

// fetch data for expense
expenseRouter.get('/', (req, res) => {
    const query = `
    SELECT 
    e.*,                           -- Select all columns from the expense table
    s.name AS subcategory_name,    -- Select the name column from the subcategory table
    c.name AS category_name,       -- Select the name column from the parent category
    i.name AS icon_name,           -- Select the name column from the icon table
    i.codepoint,                   -- Select the codepoint column from the icon table
    i.fontfamily,                  -- Select the fontfamily column from the icon table
    i.color                        -- Select the color column from the icon table
    FROM 
        public.expense e
    JOIN 
        public.subcategory s
    ON 
        e.subcategoryid = s.subcategoryid         -- Join condition between expense and subcategory
    LEFT JOIN 
        public.subcategory c
    ON 
        s.parentcategoryid = c.subcategoryid     -- Join to get the parent category name
    JOIN 
        public.icon i
    ON 
        s.iconid = i.iconid;                     -- Join condition between subcategory and icon

    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).send({ error: 'Database error' });
        }
        if (results.rows.length > 0) {
            res.status(200).json(results.rows); // Send the transaction data as JSON
        } else {
            res.status(404).send({ error: 'No expense transactions found' });
        }
    });
});

// add expense to database
expenseRouter.post('/', (req, res) => {
    const { amount, date, description, paymenttype, userid, subcategoryid } = req.body;

    // Check if all required fields are provided
    if (!amount || !date || !description || !paymenttype || !userid || !subcategoryid) {
        console.error('Missing required fields:', req.body);
        return res.status(400).send({ error: 'Missing required fields' });
    }

    // SQL query to insert the expense into the database
    const query = `
        INSERT INTO expense (amount, date, description, paymenttype, userid, subcategoryid)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;

    // Log the query and its parameters for debugging
    console.log('Executing SQL Query:');
    console.log(query);
    console.log('With parameters:', [amount, date, description, paymenttype, userid, subcategoryid]);




    // Execute the query
    db.query(query, [amount, date, description, paymenttype, userid, subcategoryid], (error, result) => {
        if (error) {
            // Log the error message to the console
            console.error('Error inserting expense:', error.message);

            // Send a response with the error
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Log success and return the inserted expense
        console.log('Successfully inserted expense:', result.rows[0]);
        res.status(201).json(result.rows[0]); // Return the inserted expense
    });
});

// Update an expense in the database
expenseRouter.put('/:id', (req, res) => {
    const expenseId = req.params.id; // Extract the expense ID from the route parameter
    const { amount, date, description, paymenttype, userid, subcategoryid } = req.body;

    // Check if the expenseId is provided
    if (!expenseId) {
        console.error('Missing expense ID');
        return res.status(400).send({ error: 'Missing expense ID' });
    }

    // Check if all required fields are provided
    if (!amount || !date || !description || !paymenttype || !userid || !subcategoryid) {
        console.error('Missing required fields:', req.body);
        return res.status(400).send({ error: 'Missing required fields' });
    }

    // SQL query to update the expense
    const query = `
        UPDATE expense
        SET 
            amount = $1,
            date = $2,
            description = $3,
            paymenttype = $4,
            userid = $5,
            subcategoryid = $6
        WHERE expenseid = $7
        RETURNING *;
    `;

    // Log the query and its parameters for debugging
    console.log('Executing SQL Query:');
    console.log(query);
    console.log('With parameters:', [amount, date, description, paymenttype, userid, subcategoryid, expenseId]);

    // Execute the query
    db.query(query, [amount, date, description, paymenttype, userid, subcategoryid, expenseId], (error, result) => {
        if (error) {
            // Log the error message to the console
            console.error('Error updating expense:', error.message);

            // Send a response with the error
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Check if any rows were updated
        if (result.rowCount === 0) {
            console.error('Expense not found for ID:', expenseId);
            return res.status(404).send({ error: 'Expense not found' });
        }

        // Log success and return the updated expense
        console.log('Successfully updated expense:', result.rows[0]);
        res.status(200).json(result.rows[0]); // Return the updated expense
    });
});

// Delete an expense from the database
expenseRouter.delete('/:id', (req, res) => {
    const expenseId = req.params.id; // Extract the expense ID from the route parameter

    // Check if the expenseId is provided
    if (!expenseId) {
        console.error('Missing expense ID');
        return res.status(400).send({ error: 'Expense ID is required' });
    }

    // SQL query to delete the expense
    const query = `
        DELETE FROM expense
        WHERE expenseid = $1
        RETURNING *;
    `;

    // Log the query for debugging
    console.log('Executing SQL Query:');
    console.log(query);
    console.log('With parameter:', expenseId);

    // Execute the query
    db.query(query, [expenseId], (error, result) => {
        if (error) {
            // Log the error message
            console.error('Error deleting expense:', error.message);

            // Send a response with the error
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Check if any rows were deleted
        if (result.rowCount === 0) {
            console.error('Expense not found for ID:', expenseId);
            return res.status(404).send({ error: 'Expense not found' });
        }

        // Log success and return the deleted expense
        console.log('Successfully deleted expense:', result.rows[0]);
        res.status(200).json({
            message: 'Expense deleted successfully',
            deletedExpense: result.rows[0],
        });
    });
});

expenseRouter.get('/specific', (req, res) => {
    const {userid, date} = req.query;

    const formateddate = new Date(date);

    const month = formateddate.getMonth() + 1; // Months are zero-indexed (January is 0)
    const year = formateddate.getFullYear();

    const query = 'SELECT e.expenseid, e.amount, e.date, e.description, e.paymenttype, e.userid, e.subcategoryid, s.parentcategoryid FROM expense e JOIN subcategory s ON e.subcategoryid = s.subcategoryid WHERE e.userid = $1 AND EXTRACT(MONTH FROM e.date) = $2 AND EXTRACT(YEAR FROM e.date) = $3';

    db.query(query, [userid, month, year], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else if (results.rows.length == 0) {
            return res.status(404).send({error: 'no expense found'});
        }
        else {
            res.status(200).send({expenses: results.rows});
        }
    });
});

expenseRouter.get('/budget', (req, res) => {
    const {userid, categoryids, date} = req.query;

    const categoryIdsArray = categoryids.split(',').map(Number);

    const formateddate = new Date(date);

    const month = formateddate.getMonth() + 1; // Months are zero-indexed (January is 0)
    const year = formateddate.getFullYear();

    const query = `
        SELECT 
    bc.basiccategoryid,
    SUM(e.amount) AS total_amount
FROM 
    basiccategory bc
LEFT JOIN 
    subcategory sc ON bc.basiccategoryid = sc.parentcategoryid
LEFT JOIN 
    expense e ON sc.subcategoryid = e.subcategoryid
WHERE 
    e.userid = $1
	AND bc.basiccategoryid = ANY($2) 
	AND EXTRACT(MONTH FROM e.date) = $3
	AND EXTRACT(YEAR FROM e.date) = $4
GROUP BY 
    bc.basiccategoryid;
    `;

    db.query(query, [userid, categoryIdsArray, month, year], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else {
            res.status(200).send({expenses: results.rows});
        }
    });
});

module.exports = expenseRouter;
