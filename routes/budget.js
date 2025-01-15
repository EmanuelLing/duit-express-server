const express = require('express');
const budgetRouter = express.Router();

// database connection
const db = require('./../db');

// budgetRouter.get('/', (req, res) => {
//     const userid = req.query.userid;

//     const query = 'SELECT b.budgetid, b.budgetname, b.startdate, b.recurrence, b.userid, bc.basiccategoryid, bc.amount FROM budget b JOIN budgetbasiccategory bc ON b.budgetid = bc.budgetid WHERE userid = $1';

//     db.query(query, [userid], (error, results) => {
//         if (error) {
//             return res.status(500).send({error: error.message});
//         }
//         else if (results.rows.length == 0) {
//             return res.status(404).send({error: 'no budget found'});
//         }
//         else {
//             res.status(200).send({budget: results.rows});
//         }
//     });
// });

budgetRouter.get('/', (req, res) => {
    const userid = req.query.userid;

    // const query = 'SELECT b.budgetid, b.amount, b.startdate, b.recurrence, b.userid, b.budgetname, STRING_AGG(bc.name, \', \') AS categorynames FROM budget b JOIN budgetbasiccategory bb ON b.budgetid = bb.budgetid JOIN basiccategory bc ON bb.basiccategoryid = bc.basiccategoryid WHERE b.userid = 1 GROUP BY b.budgetid, b.amount, b.startdate, b.recurrence, b.userid, b.budgetname';

    const query = `
  SELECT 
    b.budgetid, 
    b.amount, 
    TO_CHAR((b.startdate + INTERVAL '1 day') AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD') AS startdate,
    b.recurrence, 
    b.userid, 
    b.budgetname, 
    STRING_AGG(bc.name, ', ') AS categorynames,
    STRING_AGG(bb.basiccategoryid::text, ',') AS basiccategoryids
  FROM 
    budget b 
  JOIN 
    budgetbasiccategory bb ON b.budgetid = bb.budgetid 
  JOIN 
    basiccategory bc ON bb.basiccategoryid = bc.basiccategoryid 
  WHERE 
    b.userid = $1 
  GROUP BY 
    b.budgetid, b.amount, b.startdate, b.recurrence, b.userid, b.budgetname
  ORDER BY
    b.startdate DESC
`;

    db.query(query, [userid], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else if (results.rows.length == 0) {
            return res.status(404).send({error: 'no budget found'});
        }
        else {
            res.status(200).send({budget: results.rows});
        }
    });
});

budgetRouter.post('/', (req, res) => {
    const {budgetname, amount, startdate, recurrence, userid} = req.body;

    db.query('SELECT * FROM budget WHERE budgetname = $1 AND startdate = $2', [budgetname, startdate], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else if (results.rows.length > 0) {
            return res.status(400).send({error: "bad request"});
        }
        else {
            const query = 'INSERT INTO budget (budgetname, amount, startdate, recurrence, userid) VALUES ($1, $2, $3, $4, $5) RETURNING budgetid';

            db.query(query, [budgetname, amount, startdate, recurrence, userid], (error, results) => {
                if (error) {
                    return res.status(500).send({error: error.message});
                }

                const budgetid = results.rows[0].budgetid;

                res.status(201).send({
                    message: "budget added successfully",
                    budgetid: budgetid,
                });
            });
        }
    });
});

budgetRouter.post('/categories', async (req, res) => {
    const categories = req.body;

    // Validate input
    if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).send({ error: 'Invalid input: expected an array of categories.' });
    }

    categories.unshift(categories[0]);

    try {
        // Use a transaction to ensure all inserts succeed or fail together
        await db.query('BEGIN');
    
        const insertPromises = categories.map(category => {
          const { budgetid, basiccategoryid, amount } = category; // Destructure the fruit object
          const query = 'INSERT INTO budgetbasiccategory (budgetid, basiccategoryid, amount) VALUES ($1, $2, $3)';
          return db.query(query, [budgetid, basiccategoryid, amount]);
        });
    
        // Wait for all insert operations to complete
        const result = await Promise.all(insertPromises);

        await db.query('COMMIT');
        res.status(201).send({ message: 'budget categories added successfully' });
      } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error inserting budget categories:', error);
        res.status(500).send({ error: 'Failed to add budget categories' });
      }
});

budgetRouter.post('/budgetandcategory', (req, res) => {
    const {budgetname, amount, startdate, recurrence, userid, basiccategoryid} = req.body;

    db.query('SELECT b.budgetid, b.budgetname, b.startdate, bbc.basiccategoryid FROM budget b JOIN budgetbasiccategory bbc ON b.budgetid = bbc.budgetid WHERE b.startdate = $1 AND bbc.basiccategoryid = $2 AND b.userid = $3', [startdate, basiccategoryid, userid], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else if (results.rows.length > 0) {
            return res.status(400).send({error: "bad request"});
        }
        else {
            const query = 'INSERT INTO budget (budgetname, amount, startdate, recurrence, userid) VALUES ($1, $2, $3, $4, $5) RETURNING budgetid';

            db.query(query, [budgetname, amount, startdate, recurrence, userid], (error, results) => {
                if (error) {
                    return res.status(500).send({error: error.message});
                }

                const budgetid = results.rows[0].budgetid;

                const query2 = 'INSERT INTO budgetbasiccategory (budgetid, basiccategoryid, amount) VALUES ($1, $2, $3)';

                db.query(query2, [budgetid, basiccategoryid, amount], (error, results) => {
                    if (error) {
                        return res.status(500).send({error: error.message});
                    }
                    res.status(201).send({
                        message: "budget added successfully",
                    });             
                });
            });
        }
    });
});

budgetRouter.put('/', (req, res) => {
    const {budgetid, budgetname, budgetamount, startdate} = req.body;

    const query = `
    UPDATE budget
SET 
    amount = $1,
    startdate = $2,
    budgetname = $3
WHERE 
    budgetid = $4
    `;

    db.query(query, [budgetamount, startdate, budgetname, budgetid], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else {
            res.status(201).send({message: 'budget successfully updated'});
        }
    });

});

budgetRouter.delete('/', (req, res) => {
    const budgetid = req.body.budgetid;

    const query = `DELETE FROM budgetbasiccategory WHERE budgetid = $1`;
    const query2 = `DELETE FROM budget WHERE budgetid = $1`;

    db.query(query, [budgetid], (error, results) => {
        if (error) {
            return res.status(500).send({error: error.message});
        }
        else {
            db.query(query2, [budgetid], (error, results) => {
                if (error) {
                    return res.status(500).send({error: error.message});
                }
                res.status(201).send({message: 'budget successfully deleted'});
            });
        }
    });
});

module.exports = budgetRouter;