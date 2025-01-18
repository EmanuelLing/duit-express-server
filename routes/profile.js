const express = require('express');
const profileRouter = express.Router();
const db = require('./../db');
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

profileRouter.put('/update-profile/:userid', async (req, res) => {
    const { userid } = req.params;
    const { name, phonenumber, address } = req.body;
  
    if (!userid || isNaN(userid) || userid <= 0) {
      return res.status(400).json({ message: 'Invalid user ID provided.' });
    }
  
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ message: 'Name must have at least 3 characters.' });
    }
  
    const phonePattern = /^\+?[0-9]{1,4}?[0-9]{7,15}$/;
    if (!phonenumber || !phonePattern.test(phonenumber)) {
      return res.status(400).json({ message: 'Invalid phone number format. Please check and try again.' });
    }
  
    const addressPattern = /^No\.\d{1,4}\s[A-Za-z0-9\s]+,\s[A-Za-z0-9\s]+,\s\d{5},\s[A-Za-z\s]+$/;
    if (!address || !addressPattern.test(address)) {
      return res.status(400).json({
        message: 'Address must be valid (e.g., No.1234 Jalan 2, Taman, 76100, Melaka).',
      });
    }
  
    try {
      console.log('[DEBUG] Update Request:', {
        userid,
        name,
        phonenumber,
        address,
      });
  
      const updateResult = await db.query(
        'UPDATE appuser SET name = $1, address = $2, phonenumber = $3 WHERE userid = $4',
        [name, address, phonenumber, userid]
      );
  
      if (updateResult.rowCount === 0) {
        return res.status(404).json({ message: 'User not found or no changes made.' });
      }
  
      const selectResult = await db.query('SELECT * FROM appuser WHERE userid = $1', [userid]);
  
      res.status(200).json({
        message: 'Profile updated successfully',
        user: selectResult.rows[0],
      });
    } catch (error) {
      console.error('[ERROR] Updating profile failed:', error);
      res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
    }
});



module.exports = profileRouter;
