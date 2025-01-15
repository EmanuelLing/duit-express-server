
const express = require('express'); // to create a web server and manage routing
const income_router = express.Router(); // a router instance to handle routes specific to insight.
// Modularizes the code, making it more maintanble

// Database Connection
const db = require('./../db');  // imports db connection pool


// add income to database
income_router.post('/', (req, res) => {
    const { amount, date, description, paymenttype, userid, incomecategoryid } = req.body;

    // Check if all required fields are provided
    if (!amount || !date || !description || !paymenttype || !userid || !incomecategoryid) {
        console.error('Missing required fields:', req.body);
        return res.status(400).send({ error: 'Missing required fields' });
    }

    // SQL query to insert the expense into the database
    const query = `
        INSERT INTO income (amount, date, description, paymenttype, userid, incomecategoryid)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;

    // Log the query and its parameters for debugging
    console.log('Executing SQL Query:');
    console.log(query);
    console.log('With parameters:', [amount, date, description, paymenttype, userid, incomecategoryid]);

    // Execute the query
    db.query(query, [amount, date, description, paymenttype, userid, incomecategoryid], (error, result) => {
        if (error) {
            // Log the error message to the console
            console.error('Error inserting income:', error.message);

            // Send a response with the error
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Log success and return the inserted expense
        console.log('Successfully inserted income:', result.rows[0]);
        res.status(201).json(result.rows[0]); // Return the inserted expense
    });
});

// Update an income in the database
income_router.put('/:id', (req, res) => {
    const incomeId = req.params.id; // Extract the income ID from the route parameter
    const { amount, date, description, paymenttype, userid, incomecategoryid } = req.body;

    // Check if all required fields are provided
    if (!incomeId || !amount || !date || !description || !paymenttype || !userid || !incomecategoryid) {
        console.error('Missing required fields:', req.body);
        return res.status(400).send({ error: 'Missing required fields' });
    }

    // SQL query to update the income
    const query = `
        UPDATE income
        SET 
            amount = $1,
            date = $2,
            description = $3,
            paymenttype = $4,
            userid = $5,
            incomecategoryid = $6
        WHERE incomeid = $7
        RETURNING *;
    `;

    // Log the query for debugging
    console.log('Executing SQL Query:', query);
    console.log('With parameters:', [amount, date, description, paymenttype, userid, incomecategoryid, incomeId]);

    // Execute the query
    db.query(query, [amount, date, description, paymenttype, userid, incomecategoryid, incomeId], (error, result) => {
        if (error) {
            // Log the error message
            console.error('Error updating income:', error.message);

            // Send a response with the error
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Check if any rows were updated
        if (result.rowCount === 0) {
            console.error('Income not found for ID:', incomeId);
            return res.status(404).send({ error: 'Income not found' });
        }

        // Log success and return the updated income
        console.log('Successfully updated income:', result.rows[0]);
        res.status(200).json(result.rows[0]);
    });
});

// Delete an income from the database
income_router.delete('/:id', (req, res) => {
    const incomeId = req.params.id; // Extract the income ID from the route parameter

    // Check if the incomeId is provided
    if (!incomeId) {
        console.error('Missing income ID');
        return res.status(400).send({ error: 'Income ID is required' });
    }

    // SQL query to delete the income
    const query = `
        DELETE FROM income
        WHERE incomeid = $1
        RETURNING *;
    `;

    // Log the query for debugging
    console.log('Executing SQL Query:');
    console.log(query);
    console.log('With parameter:', incomeId);

    // Execute the query
    db.query(query, [incomeId], (error, result) => {
        if (error) {
            // Log the error message
            console.error('Error deleting income:', error.message);

            // Send a response with the error
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Check if any rows were deleted
        if (result.rowCount === 0) {
            console.error('Income not found for ID:', incomeId);
            return res.status(404).send({ error: 'Income not found' });
        }

        // Log success and return the deleted income
        console.log('Successfully deleted income:', result.rows[0]);
        res.status(200).json({
            message: 'Income deleted successfully',
            deletedIncome: result.rows[0],
        });
    });
});


module.exports = income_router;
