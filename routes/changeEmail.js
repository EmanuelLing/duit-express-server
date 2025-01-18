const express = require('express');
const changeEmailRouter = express.Router();
const pool = require('./../db'); 

changeEmailRouter.post('/change-email', async (req, res) => {
    const { userId, oldEmail, newEmail } = req.body;

    try {
      if (!userId || !oldEmail || !newEmail) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(oldEmail)) {
        return res.status(400).json({ message: 'Old email is invalid. Example: name@example.com' });
      }
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ message: 'New email is invalid. Example: name@example.com' });
      }
  
      const client = await pool.connect();
  
      try {
        await client.query('BEGIN'); 
  
        const verifyQuery = 'SELECT * FROM public.appuser WHERE userid = $1 AND email = $2';
        const verifyResult = await client.query(verifyQuery, [userId, oldEmail]);
  
        if (verifyResult.rows.length === 0) {
          await client.query('ROLLBACK'); 
          return res.status(401).json({ message: 'Old email does not match our records' });
        }
  
        const checkQuery = 'SELECT * FROM public.appuser WHERE email = $1';
        const checkResult = await client.query(checkQuery, [newEmail]);
  
        if (checkResult.rows.length > 0) {
          await client.query('ROLLBACK'); 
          return res.status(409).json({ message: 'New email is already in use' });
        }
  
        const updateQuery = 'UPDATE public.appuser SET email = $1 WHERE userid = $2 RETURNING *';
        const result = await client.query(updateQuery, [newEmail, userId]);
  
        if (result.rows.length > 0) {
          await client.query('COMMIT'); 
          res.status(200).json({ message: 'Email updated successfully', user: result.rows[0] });
        } else {
          await client.query('ROLLBACK'); 
          res.status(404).json({ message: 'User not found' });
        }
      } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Transaction error:', error.stack);
        res.status(500).json({ message: 'Internal server error during email update' });
      } finally {
        client.release(); 
      }
    } catch (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = changeEmailRouter;
