const express = require('express');
const notificationRouter = express.Router();
const db = require('./../db');
const pusher = require('./../pusher');

const createResponse = (data = {}, errorCode = 0, message = "") => {
    return { data, errorCode, message };
};

/* ----------------- Financial Aid  -------------------- */


// get financial aid notification -> response notification list
notificationRouter.get('/', async (req, res) => {
    try {
        const query = `SELECT 
            notificationid, title, type, description, image, 
            TO_CHAR(date, 'YYYY-MM-DD') AS date, 
            TO_CHAR(time, 'HH24:MI:SS') AS time, adminid 
            FROM notification
            WHERE NOT (type = 'transaction')`;
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


// get financial aid notification {date} -> request date, response notification list
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
            WHERE date::DATE = $1 AND NOT (type = 'transaction')
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

// Get all financial aid categories -> response category list
notificationRouter.get('/categories', async (req, res) => {
    try {
        const query = `
            SELECT financialaidcategoryid, name, icon
            FROM financialaidcategory
            ORDER BY name ASC
        `;
        const result = await db.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json(createResponse([], 0, 'No categories found'));
        }

        res.status(200).json(createResponse(result.rows, 0, 'Categories retrieved successfully'));
    } catch (error) {
        console.error('Error fetching financial aid categories:', error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});


// get financial aid categories {notificationid} -> request notification id, response financial aid category list
notificationRouter.get('/:notificationid/categories', async (req, res) => {
    try {
        const { notificationid } = req.params;

        const query = `
            SELECT f.financialaidcategoryid, f.name
            FROM financialaidcategory_notification fn
            INNER JOIN financialaidcategory f ON fn.financialaidcategoryid = f.financialaidcategoryid
            WHERE fn.notificationid = $1
        `;
        const result = await db.query(query, [notificationid]);

        res.status(200).json(createResponse(result.rows, 0, 'Categories retrieved successfully'));
    } catch (error) {
        console.error('Error fetching categories for notification:', error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// get notifications {financialaidcategoryid} -> request financialid, response notification list
notificationRouter.get('/category/:financialaidcategoryid', async (req, res) => {
    try {
        const { financialaidcategoryid } = req.params;

        const query = `
            SELECT n.notificationid, n.title, n.type, n.description, n.image,
                   TO_CHAR(n.date, 'YYYY-MM-DD') AS date, 
                   TO_CHAR(n.time, 'HH24:MI:SS') AS time, n.adminid
            FROM financialaidcategory_notification fn
            INNER JOIN notification n ON fn.notificationid = n.notificationid
            WHERE fn.financialaidcategoryid = $1
        `;
        const result = await db.query(query, [financialaidcategoryid]);

        res.status(200).json(createResponse(result.rows, 0, 'Notifications retrieved successfully'));
    } catch (error) {
        console.error('Error fetching notifications for category:', error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});


// add notification -> request notification details, response success message
notificationRouter.post('/', async (req, res) => {
    try {
        const { title, type, description, image, adminid, financialaidcategoryids } = req.body;

        const query = `
        INSERT INTO notification (title, type, description, image, date, time, adminid)
        VALUES ($1, $2, $3, $4, (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date, (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::time, $5)
        RETURNING notificationid
        `;

        const values = [title, type, description, image, adminid]; 
        const result = await db.query(query, values);
        const notificationid = result.rows[0].notificationid;

        pusher.trigger('notifications', 'new_notification', {
            notificationid,
            title,
            description,
            image,
        }).then(() => {
            console.log('Pusher notification sent successfully');
        }).catch((error) => {
            console.error('Error sending Pusher notification:', error);
        });

        if (financialaidcategoryids && Array.isArray(financialaidcategoryids) && financialaidcategoryids.length > 0) {
            const categoryQueries = financialaidcategoryids.map(financialaidcategoryid => {
                return db.query(`
                    INSERT INTO financialaidcategory_notification (financialaidcategoryid, notificationid)
                    VALUES ($1, $2)
                `, [financialaidcategoryid, notificationid]);
            });
            await Promise.all(categoryQueries);
        }

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

        const currentDateQuery = `
        SELECT 
            (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date AS current_date,
            (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::time AS current_time
        `;
        const currentTimeResult = await db.query(currentDateQuery);
        const currentDate = currentTimeResult.rows[0].current_date;
        const currentTime = currentTimeResult.rows[0].current_time;

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

// update financial aid category -> request notificationid and financialaids, response success message
notificationRouter.put('/:notificationid/categories', async (req, res) => {
    try {
        const { notificationid } = req.params;
        const { financialaidcategoryids } = req.body; 

        const deleteQuery = `
            DELETE FROM financialaidcategory_notification WHERE notificationid = $1
        `;
        await db.query(deleteQuery, [notificationid]);

        if (financialaidcategoryids && Array.isArray(financialaidcategoryids) && financialaidcategoryids.length > 0) {
            const categoryQueries = financialaidcategoryids.map(financialaidcategoryid => {
                return db.query(`
                    INSERT INTO financialaidcategory_notification (financialaidcategoryid, notificationid)
                    VALUES ($1, $2)
                `, [financialaidcategoryid, notificationid]);
            });
            await Promise.all(categoryQueries); 
        }

        res.status(200).json(createResponse(null, 0, 'Notification categories updated successfully'));
    } catch (error) {
        console.error('Error updating notification categories:', error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});


// delete notification -> request notification id, response success message
notificationRouter.delete('/:notificationid', async (req, res) => {
    try {
        const { notificationid } = req.params;

        const deleteCategoriesQuery = `
            DELETE FROM financialaidcategory_notification WHERE notificationid = $1
        `;
        await db.query(deleteCategoriesQuery, [notificationid]);

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

        // delete expired transaction alert (based on current month)
        const deleteQuery = `
        DELETE FROM notification n
        USING usernotification un
        WHERE n.notificationid = un.notificationid
        AND n.type = 'transaction'
        AND n.date < date_trunc('month', NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date
        AND un.userid = $1
        `;

        try {
            const deleteResult = await db.query(deleteQuery, [userid]);

            if (deleteResult.rowCount === 0) {
                console.log('No expired transaction alerts to delete.');
            } else {
                console.log(`Deleted ${deleteResult.rowCount} expired transaction alerts.`);
            }
        } catch (error) {
            console.error('Error executing delete query:', error.message);
            return res.status(500).json({ message: 'Error deleting expired transaction alerts' });
        }

        console.log('Expired transaction alerts deleted successfully.');


        // get budget
        const budgetQuery = `
            SELECT budgetid, amount, budgetname FROM budget 
            WHERE userid = $1
            AND startdate <= date_trunc('month', NOW() AT TIME ZONE 'Asia/Kuala_Lumpur') + interval '1 month'
            AND startdate >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Kuala_Lumpur');
        `;
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
)
AND e.date >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')
AND e.date < date_trunc('month', NOW() AT TIME ZONE 'Asia/Kuala_Lumpur') + interval '1 month';


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


            if (reachedThresholds.length > 0) {
                // generate the highest only
                const maxThreshold = Math.max(...reachedThresholds);
                console.log(`Highest threshold reached: ${maxThreshold}%`);

                // check if notification already exists
                // get notification -> request title & userID
                const notificationCheckQuery = `
                    SELECT * FROM notification n
                    INNER JOIN usernotification un ON n.notificationid = un.notificationid
                    WHERE n.title = $1 AND un.userid = $2
                `;
                let checkResult;
                try {
                    checkResult = await db.query(notificationCheckQuery, [`Budget "${budgetName}" reached ${maxThreshold}%`, userid]);
                } catch (error) {
                    console.error('Error executing notification check query:', error.message);
                    return res.status(500).json({ message: 'Error checking notifications' });
                }

                if (checkResult.rows.length === 0) {
                    console.log(`No existing notification for threshold ${maxThreshold}%. Creating new notification.`);

                    // add notification -> request notification details, response message
                    const notificationQuery = `
                        INSERT INTO notification (title, type, description, date, time)
                        VALUES ($1, 'transaction', $2, (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date, (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::time)
                        RETURNING notificationid
                    `;

                    const thresholdMessages = {
                        50: `Your spending has reached 50% of your budget. It might be a good time to start planning how to manage the remaining funds. Keep track of your expenses and prioritize your needs.`,
                        70: `You're at 70% of your budget! You may want to reconsider your spending habits. It's a good idea to review your expenses and adjust your plans accordingly.`,
                        90: `You've hit 90% of your budget! Be cautious with your spending from now on to avoid exceeding your limit. Review upcoming expenses and look for ways to save.`,
                        100: `Your spending has exceeded your budget! It's crucial to stop and re-evaluate your remaining expenses. You may need to cut back or adjust your financial plans.`,
                    };

                    const nextMonthFirstDay = new Date();
                    nextMonthFirstDay.setMonth(nextMonthFirstDay.getMonth() + 1);
                    nextMonthFirstDay.setDate(1);
                    const deletionDate = nextMonthFirstDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    
                    // Modify the notification description based on the threshold
                    const notificationDescription = `
Your spending has reached ${maxThreshold}% of your budget: "${budgetName}".
                    
Details:
- Budget Name: ${budgetName}
- Total Expense: RM ${totalSpent}
- Budget Amount: RM ${budgetAmount}
                    
Tips:
${thresholdMessages[maxThreshold]}

Note:
This notification will be automatically deleted on ${deletionDate}.
`;
                    
                    const notificationValues = [
                        `Budget "${budgetName}" reached ${maxThreshold}%`,
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

                    console.log(`Notification created and linked for threshold ${maxThreshold}%`);
                } else {
                    console.log(`Notification for threshold ${maxThreshold}% already exists.`);
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