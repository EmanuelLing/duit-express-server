
const express = require('express'); // to create a web server and manage routing
const basic_categories = express.Router(); // a router instance to handle routes specific to insight.
// Modularizes the code, making it more maintanble

// Database Connection
const db = require('./../db');  // imports db connection pool


// to view all basic category and icon
basic_categories.get('/',(req,res) =>{    
    const query = `
    SELECT 
    c.basiccategoryid AS category_Id,
    c.name AS category_name, -- name from table AS name we want set
    i.iconid AS icon_id,
    i.codepoint AS code_point,
    i.fontfamily AS font_family,
    i.color AS color
    From 
	    public.basiccategory c
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
            res.status(404).send({error: ' no category found'});
        }
        
    });

})
module.exports = basic_categories;