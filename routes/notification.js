const express = require('express');
const notificationRouter = express.Router();
const db = require('./../db');
const cloudinary = require('cloudinary').v2;

const createResponse = (data = {}, errorCode = 0, message = "") => {
    return { data, errorCode, message };
};

cloudinary.config({
    cloud_name: 'disfofeam',
    api_key: '795999751399832',
    api_secret: 'Z15uzj4l8SyjGqA-l2YArT2vP70',
});


/* ----------------- Welfare Program -------------------- */


// get welfare notification -> response notification list
notificationRouter.get('/', async (req, res) => {
    try {
        const query = `SELECT 
            notificationid, title, type, description, image, 
            TO_CHAR(date, 'YYYY-MM-DD') AS date, 
            TO_CHAR(time, 'HH24:MI:SS') AS time, adminid 
            FROM notification
            WHERE type = 'welfare'`;
        const result = await db.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json(createResponse([], 0, 'No notification found'));
        }

        res.status(200).json(createResponse(result.rows, 0, 'Notification retrieved successfully'));
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});


// get welfare notification {date} -> request date, response notification list
notificationRouter.get('/date', async (req, res) => {
    try {
        
        const date = req.query.date || req.body.date;
        console.log('Received date:', date);

        if (!date) {
            return res.status(400).json(createResponse([], -1, 'Date parameter is required'));
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            return res.status(400).json(createResponse([], -1, 'Invalid date format'));
        }

        const query = `
            SELECT 
                notificationid, title, type, description, image, 
                TO_CHAR(date, 'YYYY-MM-DD') AS date, TO_CHAR(time, 'HH24:MI:SS') AS time, adminid 
            FROM notification
            WHERE date::DATE = $1 AND type = 'welfare'
        `;
        const values = [date];
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json(createResponse([], 0, 'No notifications found for the specified date'));
        }

        res.status(200).json(createResponse(result.rows, 0, 'Notifications retrieved successfully'));
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// add notification -> request notification details, response success message
notificationRouter.post('/', async (req, res) => {
    try {
        const { title, type, description, image, adminid } = req.body;

        const query = `
        INSERT INTO notification (title, type, description, image, date, time, adminid)
        VALUES ($1, $2, $3, $4, (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur'), (CURRENT_TIME AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur'), $5)
        RETURNING notificationid
        `;

            /*
        const query = `
            INSERT INTO notification (title, type, description, image, date, time, adminid)
            VALUES ($1, $2, $3, $4, (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur')::date, (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur')::time, $5)
            RETURNING notificationid
        `;*/


        const values = [title, type, description, image, adminid]; 
        const result = await db.query(query, values);
        const notificationid = result.rows[0].notificationid;

        res.status(201).json(createResponse({ notificationid }, 0, 'Notification added successfully'));
    } catch (error) {
        console.error('Error adding notification:', error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});


// update notification -> request notification details, response success message

notificationRouter.put('/:notificationid', async (req, res) => {
    try {
        const { notificationid } = req.params; 
        const { title, type, description, image, adminid } = req.body; 

        console.log("Request received at /notification/:notificationid");
        console.log("Request body:", req.body);
        console.log("Notification ID:", req.params.notificationid);

        // Check if the notification exists
        const notificationResult = await db.query('SELECT * FROM notification WHERE notificationid = $1', [notificationid]);
        if (notificationResult.rows.length === 0) {
            return res.status(404).json(createResponse(null, -1, 'Notification not found'));
        }

        const fieldsToUpdate = [];
        const values = [];
        let query = 'UPDATE notification SET ';

        if (title) {
            fieldsToUpdate.push('title = $' + (fieldsToUpdate.length + 1));
            values.push(title);
        }
        if (type) {
            fieldsToUpdate.push('type = $' + (fieldsToUpdate.length + 1));
            values.push(type);
        }
        if (description) {
            fieldsToUpdate.push('description = $' + (fieldsToUpdate.length + 1));
            values.push(description);
        }
        if (image) {
            fieldsToUpdate.push('image = $' + (fieldsToUpdate.length + 1));
            values.push(image);
        }

        const currentDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }); // ISO 8601 格式
        const currentTime = new Date().toLocaleTimeString('en-CA', { timeZone: 'Asia/Kuala_Lumpur', hour12: false });
        fieldsToUpdate.push('date = $' + (fieldsToUpdate.length + 1));
        values.push(currentDate);
        fieldsToUpdate.push('time = $' + (fieldsToUpdate.length + 1));
        values.push(currentTime);
        
        if (adminid) {
            fieldsToUpdate.push('adminid = $' + (fieldsToUpdate.length + 1));
            values.push(adminid);
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json(createResponse(null, -1, 'No fields to update'));
        }

        query += fieldsToUpdate.join(', ') + ' WHERE notificationid = $' + (fieldsToUpdate.length + 1);
        values.push(notificationid);

        // Update the notification
        const result = await db.query(query, values);

        if (result.rowCount > 0) {
            // Retrieve the updated notification
            const updatedNotification = await db.query('SELECT * FROM notification WHERE notificationid = $1', [notificationid]);
            res.status(200).json(createResponse(updatedNotification.rows[0], 0, 'Notification successfully updated'));
        } else {
            res.status(404).json(createResponse(null, -1, 'Notification not found'));
        }
        
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// delete notification -> request notification id, response success message
notificationRouter.delete('/:notificationid', async (req, res) => {
    try {
        const { notificationid } = req.params;
        const query = 'DELETE FROM notification WHERE notificationid = $1';

        const result = await db.query(query, [notificationid]);

        if (result.rowCount > 0) {
            res.status(200).json(createResponse(null, 0, 'Notification successfully deleted'));
        } else {
            res.status(404).json(createResponse(null, -1, 'Notification not found'));
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

/* ----------------- Transaction -------------------- */

// get transaction notification {userid} -> request userid, response notification list

notificationRouter.get('/transaction/:userid', async (req, res) => {
    try {
        const { userid } = req.params;
        const query = `
            SELECT n.notificationid, n.title, n.type, n.description, n.image, 
            TO_CHAR(n.date, 'YYYY-MM-DD') AS date, 
            TO_CHAR(n.time, 'HH24:MI:SS') AS time, n.adminid 
            FROM notification n
            INNER JOIN usernotification un 
            ON n.notificationid = un.notificationid
            WHERE n.type = 'transaction' AND un.userid = $1
        `;
        const result = await db.query(query, [userid]);

        res.status(200).json(createResponse(result.rows, 0, 'Transaction notifications retrieved successfully'));
    } catch (error) {
        console.error('Error fetching transaction notifications:', error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// auto send transaction alert notification (When expense reach 50%/70%/90%/100% of budget)
// -> request userid, response message 

notificationRouter.post('/check-budget', async (req, res) => {
    try {
        const { userid } = req.body;

        if (!userid) {
            return res.status(400).json({ message: 'UserID is required' });
        }

        console.log('Starting budget query for UserID:', userid);

        // get budget
        const budgetQuery = `SELECT budgetid, amount, budgetname FROM budget WHERE userid = $1`;
        let budgetResult;
        try {
            budgetResult = await db.query(budgetQuery, [userid]);
        } catch (error) {
            console.error('Error executing budget query:', error.message);
            return res.status(500).json({ message: 'Error fetching budget data' });
        }

        if (budgetResult.rows.length === 0) {
            return res.status(404).json({ message: 'No budgets found for the user' });
        }

        console.log('Budget data fetched:', budgetResult.rows);

        // check every budget
        for (const budget of budgetResult.rows) {
            const { budgetid, amount: budgetAmount, budgetname: budgetName } = budget;

            console.log(`Checking expenses for BudgetID: ${budgetid}, Amount: ${budgetAmount}`);

            // get expense in budget -> request userID & budgetID, response sum of amount
            const expenseQuery = `
                SELECT COALESCE(SUM(e.amount), 0) AS totalSpent
                FROM expense e
                WHERE e.userid = $1
                AND (
                    EXISTS (
                        -- Customize Category Path
                        SELECT 1
                        FROM subcategory sc
                        JOIN customizecategory cc ON sc.parentcategoryid = cc.customizecategoryid
                        JOIN budgetcustomizecategory bcc ON cc.customizecategoryid = bcc.customizecategoryid
                        WHERE sc.subcategoryid = e.subcategoryid
                        AND bcc.budgetid = $2
                    )
                    OR
                    EXISTS (
                        -- Basic Category Path
                        SELECT 1
                        FROM subcategory sc
                        JOIN basiccategory bc ON sc.parentcategoryid = bc.basiccategoryid
                        JOIN budgetbasiccategory bbc ON bc.basiccategoryid = bbc.basiccategoryid
                        WHERE sc.subcategoryid = e.subcategoryid
                        AND bbc.budgetid = $2
                    )
                );

            `;
            let expenseResult;
            try {
                expenseResult = await db.query(expenseQuery, [userid, budgetid]);
            } catch (error) {
                console.error('Error executing expense query:', error.message);
                return res.status(500).json({ message: 'Error fetching expense data' });
            }

            const totalSpent = expenseResult.rows[0]?.totalspent || 0;
            const percentage = (totalSpent / budgetAmount) * 100;

            console.log(`Total spent: ${totalSpent}, Percentage: ${percentage.toFixed(2)}%`);

            const thresholds = [50, 70, 90, 100];

            const reachedThresholds = thresholds.filter(threshold => percentage >= threshold);


            for (const threshold of reachedThresholds) {
                console.log(`Threshold reached: ${threshold}%`);

                // check if notification already exists
                // get notification -> request title & userID
                const notificationCheckQuery = `
                    SELECT * FROM notification n
                    INNER JOIN usernotification un ON n.notificationid = un.notificationid
                    WHERE n.title = $1 AND un.userid = $2
                `;
                let checkResult;
                try {
                    checkResult = await db.query(notificationCheckQuery, [`Budget "${budgetName}" reached ${threshold}%`, userid]);
                } catch (error) {
                    console.error('Error executing notification check query:', error.message);
                    return res.status(500).json({ message: 'Error checking notifications' });
                }

                if (checkResult.rows.length === 0) {
                    console.log(`No existing notification for threshold ${threshold}%. Creating new notification.`);

                    // add notification -> request notification details, response message
                    const notificationQuery = `
                        INSERT INTO notification (title, type, description, date, time)
                        VALUES ($1, 'transaction', $2, (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur'), (CURRENT_TIME AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur'))
                        RETURNING notificationid
                    `;

                    const notificationDescription = `
Your spending has reached ${threshold}% of your budget: "${budgetName}".
                        
Details:
- Budget Name: ${budgetName}
- Total Expense: RM ${totalSpent}
- Budget Amount: RM ${budgetAmount}
                        
Tips:
To stay within your budget, you may want to review your spending for the remaining period. Consider cutting down on non-essential expenses or planning your upcoming purchases carefully. 
Remember, sticking to your budget is key to achieving your financial goals!
`;
                    
                    const notificationValues = [
                        `Budget "${budgetName}" reached ${threshold}%`,
                        notificationDescription
                    ];

                    let notificationResult;

                    try {
                        notificationResult = await db.query(notificationQuery, notificationValues);
                    } catch (error) {
                        console.error('Error executing notification insert query:', error.message);
                        return res.status(500).json({ message: 'Error creating notification' });
                    }

                    const notificationID = notificationResult.rows[0].notificationid;

                    // add usernotification -> request notificationID & userID
                    const userNotificationQuery = `
                        INSERT INTO usernotification (notificationid, userid) VALUES ($1, $2)
                    `;
                    try {
                        await db.query(userNotificationQuery, [notificationID, userid]);
                    } catch (error) {
                        console.error('Error executing user notification insert query:', error.message);
                        return res.status(500).json({ message: 'Error linking notification to user' });
                    }

                    console.log(`Notification created and linked for threshold ${threshold}%`);
                } else {
                    console.log(`Notification for threshold ${threshold}% already exists.`);
                }
            }
        }

        res.status(200).json({ message: 'Budget analysis completed and notifications sent if applicable' });
    } catch (error) {
        console.error('Unexpected error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = notificationRouter;