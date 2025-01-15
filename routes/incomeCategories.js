
const express = require('express'); // to create a web server and manage routing
const income_categories_router = express.Router(); // a router instance to handle routes specific to insight.
// Modularizes the code, making it more maintanble

// Database Connection
const db = require('./../db');  // imports db connection pool

// to view all income category and icon
income_categories_router.get('/',(req,res) =>{    
    const query = `
    SELECT 
    c.incomecategoryid AS incomeCategory_Id,
    c.name AS incomeCategory_name, -- name from table AS name we want set
    i.iconid AS icon_id,
    i.codepoint AS code_point,
    i.fontfamily AS font_family,
    i.color AS color
    From 
	    public.incomecategory c
    JOIN 
	    public.icon i
    ON 
	    c.iconid = i.iconid
    `;

    db.query(query, (error,results) => {
        if(error){
            console.error('Database error:', error);
            return res.status(500).send({error: 'Database Error'});
        }
        // use results.rows for postgresql
        if(results.rows.length > 0){
            res.status(200).json(results.rows);
        }
        else{
            res.status(404).send({error: ' no Income Category found'});
        }
        
    });

})

// add income to database
income_categories_router.post('/', (req, res) => {
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

module.exports = income_categories_router;
