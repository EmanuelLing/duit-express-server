const express = require('express'); // to create a web server and manage routing
const icons_router = express.Router(); // a router instance to handle routes specific to insight.
// Modularizes the code, making it more maintanble

// database connection
const db = require('./../db');

// Add icon to database
icons_router.post('/', (req, res) => {
    const { name, codePoint, fontFamily, color } = req.body;

    // Check if all required fields are provided
    if (!name || !codePoint || !fontFamily || !color) {
        console.error('Missing required fields:', req.body);
        return res.status(400).send({ error: 'Missing required fields' });
    }

    // SQL query to insert the icon into the database
    const query = `
        INSERT INTO icon (name, codepoint, fontfamily, color)
        VALUES ($1, $2, $3, $4) RETURNING *;
    `;

    // Execute the query
    db.query(query, [name, codePoint, fontFamily, color], (error, result) => {
        if (error) {
            // Log the error message to the console
            console.error('Error inserting icon:', error.message);

            // Send a response with the error
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Convert color to integer if it's returned as a string
        const insertedIcon = result.rows[0];
        if (typeof insertedIcon.color === 'string') {
            insertedIcon.color = parseInt(insertedIcon.color, 10);
        }

        // Log success and return the inserted icon
        console.log('Successfully inserted icon:', insertedIcon);
        res.status(201).json(insertedIcon);
    });
});

// get icon from db
icons_router.get('/',(req,res)=>{
    const query = 'SELECT * FROM icon';

    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).send({ error: 'Database error' });
        }
        if (results.rows.length > 0) {
            res.status(200).json(results.rows);
        }      
        else {
            res.status(404).send({error: 'no transaction found'});
        }
    });
})

module.exports = icons_router;