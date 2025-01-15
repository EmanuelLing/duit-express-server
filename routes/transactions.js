// to all transaction (expense and income) to display

const express = require('express');
const transactionList_router = express.Router();

const db = require('./../db');

transactionList_router.get('/',(req,res) => {
    const query = `
    SELECT
    e.expenseid AS transaction_id,
    e.amount,
    e.date,
    e.description,
    e.paymenttype,
    e.userid,
    e.subcategoryid,
    NULL AS incomecategoryid, -- Null for income column
    'Expense' AS transaction_type,
    s.name AS subcategory_name, -- Subcategory name
    bc.name AS category_name, -- Category name from basiccategory
    i.codepoint,
    i.fontfamily,
    i.color
    FROM
        expense e
    LEFT JOIN subcategory s ON e.subcategoryid = s.subcategoryid
    LEFT JOIN basiccategory bc ON s.parentcategoryid = bc.basiccategoryid -- Join to get category name
    LEFT JOIN icon i ON s.iconid = i.iconid

    UNION ALL

    SELECT
    i.incomeid AS transaction_id,
    i.amount,
    i.date,
    i.description,
    i.paymenttype,
    i.userid,
    NULL AS subcategoryid, -- Null for expense-specific column
    i.incomecategoryid,
    'Income' AS transaction_type,
    ic.name AS subcategory_name, -- Subcategory name
    NULL AS category_name, -- No category name for income
    ico.codepoint,
    ico.fontfamily,
    ico.color
    FROM
        income i
    LEFT JOIN incomecategory ic ON i.incomecategoryid = ic.incomecategoryid
    LEFT JOIN icon ico ON ic.iconid = ico.iconid

    ORDER BY date DESC, transaction_type;

    `;

    db.query(query,(error, results) =>{
        if(error){
            console.error('Database error:', error);
            return res.status(500).send({error:'Database error'});
        }
        if (results.rows.length > 0) {
            res.status(200).json(results.rows); // Send the transaction data as JSON
        } else {
            res.status(404).send({ error: 'No transactions found' });
        }
    })
});

module.exports = transactionList_router;