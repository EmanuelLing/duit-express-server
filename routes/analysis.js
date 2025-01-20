const express = require('express');
const analysisRouter = express.Router();

// database connection
const db = require('./../db');

analysisRouter.get('/', (req, res) => {
    const {userid, date} = req.query;

    const formateddate = new Date(date);

    const month = formateddate.getMonth() + 1; // Months are zero-indexed (January is 0)
    const year = formateddate.getFullYear();

    const query = `SELECT 
    bc.name AS category_name,
    i.codepoint,
    i.fontfamily,
    i.color, 
    COALESCE(b.amount, 0) AS budget_amount, 
    COALESCE(SUM(e.amount), 0) AS expense_amount
FROM 
    basiccategory bc
LEFT JOIN 
    budgetbasiccategory bbc ON bc.basiccategoryid = bbc.basiccategoryid
LEFT JOIN
	icon i ON bc.iconid = i.iconid
LEFT JOIN 
    budget b ON bbc.budgetid = b.budgetid AND b.userid = $1
LEFT JOIN 
    subcategory sc ON bc.basiccategoryid = sc.parentcategoryid
LEFT JOIN 
    expense e ON sc.subcategoryid = e.subcategoryid 
               AND e.userid = 1 
               AND EXTRACT(MONTH FROM e.date) = $2
               AND EXTRACT(YEAR FROM e.date) = $3
WHERE 
    b.userid = $1
    AND EXTRACT(MONTH FROM b.startdate) = $2
    AND EXTRACT(YEAR FROM b.startdate) = $3
GROUP BY 
    bc.basiccategoryid, bc.name, i.iconid, b.amount
ORDER BY 
    bc.name;`;

    db.query(query, [userid, month, year], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else if (results.rows.length == 0) {
            return res.status(404).send({error: 'no analysis found'});
        }
        else {
            res.status(200).send({expenses: results.rows});
        }
    });
});

module.exports = analysisRouter;