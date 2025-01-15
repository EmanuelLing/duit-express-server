const express = require('express');
const db = require('./../db'); 

const authRouter = express.Router();

authRouter.post('/change-password', async (req, res) => {
  const { userid, currentPassword, newPassword } = req.body;

  console.log('Received UserID:', userid);
  console.log('Current Password:', currentPassword);
  console.log('New Password:', newPassword);

  try {
    if (!userid || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userQuery = await db.query('SELECT * FROM appuser WHERE userid = $1', [userid]);
    console.log('User Query Result:', userQuery.rows);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];

    if (user.password !== currentPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    await db.query('UPDATE appuser SET password = $1 WHERE userid = $2', [newPassword, userid]);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = authRouter;
