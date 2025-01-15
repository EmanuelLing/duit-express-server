const express = require('express');
const categoryRouter = express.Router();

// database connection
const db = require('./../db');

categoryRouter.get('/', (req, res) => {
    const query  = 'SELECT * FROM basiccategory';

    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).send({error: 'Database error'});
        }
        else if (results.rows.length == 0) {
            res.status(404).send({message: 'no category found'});
        }
        else {
            res.status(200).send({category: results.rows});
        }
    });
});

module.exports = categoryRouter;
