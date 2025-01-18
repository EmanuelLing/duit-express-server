const express = require('express');
const db = require('./../db'); 

const authRouter = express.Router();

authRouter.post('/change-password', async (req, res) => {
    const { userid, currentPassword, newPassword } = req.body;

    console.log('[DEBUG] Received Request:', { userid, currentPassword, newPassword });
  
    try {
      // Validate required fields
      if (!userid || !currentPassword || !newPassword) {
        console.error('[ERROR] Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Validate new password constraints
      if (newPassword.length < 6) {
        console.error('[ERROR] New password must be at least 6 characters long');
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }
  
      // Check if the user exists
      const userQuery = await db.query('SELECT * FROM appuser WHERE userid = $1', [userid]);
      console.log('[DEBUG] User Query Result:', userQuery.rows);
  
      if (userQuery.rows.length === 0) {
        console.error('[ERROR] User not found');
        return res.status(404).json({ error: 'User not found' });
      }
  
      const user = userQuery.rows[0];
  
      // Check if the current password matches
      if (user.password !== currentPassword) {
        console.error('[ERROR] Invalid current password');
        return res.status(401).json({ error: 'Invalid current password' });
      }
  
      // Update password
      await db.query('UPDATE appuser SET password = $1 WHERE userid = $2', [newPassword, userid]);
      console.log('[DEBUG] Password updated successfully for UserID:', userid);
  
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('[ERROR] Server error:', error);
      res.status(500).json({ error: 'Server error' });
    }
});

module.exports = authRouter;
