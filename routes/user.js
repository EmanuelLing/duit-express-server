const express = require('express');
const userRouter = express.Router();
const db = require('./../db');

// Middleware to validate user ID
function validateUserId(req, res, next) {
    const { userid } = req.params;
    if (!userid || isNaN(userid) || parseInt(userid) <= 0) {
        return res.status(400).json({ status: 'error', message: 'Invalid user ID' });
    }
    next();
}

// Route to fetch user details
userRouter.get('/user/:userid', validateUserId, async (req, res) => {
    const { userid } = req.params;

    console.log(`[DEBUG] Incoming request for user ID: ${userid}`);

    try {
        const query = `
            SELECT userid, name, email, address, phonenumber 
            FROM appuser 
            WHERE userid = $1
        `;
        const result = await db.query(query, [userid]);

        console.log(`[DEBUG] Query result for user ID ${userid}:`, result.rows);

        if (result.rows.length === 0) {
            console.warn(`[WARNING] User not found for ID: ${userid}`);
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({ status: 'success', user: result.rows[0] });
    } catch (error) {
        console.error('[ERROR] Fetching user details failed:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

module.exports = userRouter;
