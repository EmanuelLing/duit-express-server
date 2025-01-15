const express = require('express');
const changeEmailRouter = express.Router();
const pool = require('./../db'); 

changeEmailRouter.post('/change-email', async (req, res) => {
  const { userId, oldEmail, newEmail } = req.body;

  try {
    if (!userId || !oldEmail || !newEmail) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const client = await pool.connect();

    try {
      const verifyQuery = 'SELECT * FROM public.appuser WHERE userid = $1 AND email = $2';
      const verifyResult = await client.query(verifyQuery, [userId, oldEmail]);

      if (verifyResult.rows.length === 0) {
        return res.status(401).json({ message: 'Old email does not match our records' });
      }

      const checkQuery = 'SELECT * FROM public.appuser WHERE email = $1';
      const checkResult = await client.query(checkQuery, [newEmail]);

      if (checkResult.rows.length > 0) {
        return res.status(409).json({ message: 'New email is already in use' });
      }

      const updateQuery = 'UPDATE public.appuser SET email = $1 WHERE userid = $2 RETURNING *';
      const result = await client.query(updateQuery, [newEmail, userId]);

      if (result.rows.length > 0) {
        res.status(200).json({ message: 'Email updated successfully', user: result.rows[0] });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } finally {
      client.release(); 
    }
  } catch (error) {
    console.error('Error executing query', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = changeEmailRouter;