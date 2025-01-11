const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/user/:userid', async (req, res) => {
  const { userid } = req.params;

  try {
    const result = await db.query(
      'SELECT userid, name, email, address, phonenumber FROM appuser WHERE userid = $1',
      [userid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Fetching user details failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
