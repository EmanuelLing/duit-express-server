
const express = require('express'); // to create a web server and manage routing
const subcategories_router = express.Router(); // a router instance to handle routes specific to insight.
// Modularizes the code, making it more maintanble

// Database Connection
const db = require('./../db');  // imports db connection pool

// Add subcategory to the database
subcategories_router.post('/:id/:userId', (req, res) => {
    const { subcategory_name, parentcategoryid, iconid } = req.body;
    const userId = req.params.userId;

    // Check if required fields are provided in the body
    if (!subcategory_name || !parentcategoryid || !iconid) {
        console.error('Missing required fields:', req.body);
        return res.status(400).send({ error: 'Missing required fields' });
    }

    // SQL query to insert the subcategory into the database
    const query = `
        INSERT INTO subcategory (name, parentcategoryid, iconid, userid)
        VALUES ($1, $2, $3, $4) RETURNING *;
    `;

    // Execute the query
    db.query(query, [subcategory_name, parentcategoryid, iconid, userId], (error, result) => {
        if (error) {
            console.error('Error inserting subcategory:', error.message);
            return res.status(500).send({ error: 'Database error', details: error.message });
        }

        // Return the inserted subcategory
        const insertedSubcategory = result.rows[0];
        console.log('Successfully inserted subcategory:', insertedSubcategory);
        res.status(201).json(insertedSubcategory);
    });
});



// to view all subcategories based on userid

subcategories_router.get('/basic/:parentCategoryId/:userId', (req, res) => {
    const parentCategoryId = req.params.parentCategoryId;
    const userId = req.params.userId;

    const query = `
    SELECT 
        s.subcategoryid AS subcategory_id,
        s.name AS subcategory_name,
        s.parentcategoryid,
        i.iconid AS iconid,
        i.codepoint,                   -- Select the codepoint column from the icon table
        i.fontfamily,                  -- Select the fontfamily column from the icon table
        i.color                        -- Select the color column from the icon table
    FROM 
        public.subcategory s
    JOIN
        public.icon i   
    ON
        s.iconid = i.iconid
    WHERE 
        s.parentcategoryid = $1
        AND (s.userid = $2 OR s.userid IS NULL)
    `;

    db.query(query, [parentCategoryId, userId], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).send({ error: 'Database Error' });
        }
        // use results.rows for postgresql
        if (results.rows.length > 0) {
            res.status(200).json(results.rows);
        } else {
            res.status(404).send({ error: 'No category found' });
        }
    });
});

module.exports = subcategories_router;