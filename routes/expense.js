const express = require('express');
const expenseRouter = express.Router();

// database connection
const db = require('./../db');

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