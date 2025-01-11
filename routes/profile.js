const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

router.put('/update-profile/:userid', async (req, res) => {
  const { userid } = req.params;
  const { name, address, phonenumber, email } = req.body;

  if (!userid || isNaN(userid) || userid <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const updateResult = await db.query(
      'UPDATE appuser SET name = $1, address = $2, phonenumber = $3, email = $4 WHERE userid = $5',
      [name, address, phonenumber, email, userid]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const selectResult = await db.query('SELECT * FROM appuser WHERE userid = $1', [userid]);
    res.status(200).json({
      message: 'Profile updated successfully',
      user: selectResult.rows[0],
    });
  } catch (error) {
    console.error('[ERROR] Updating profile failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post(
  '/update-profile-image/:userid',
  upload.single('personalImage'),
  async (req, res) => {
    const { userid } = req.params;

    if (!userid || isNaN(userid) || userid <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    try {
      const compressedImageBuffer = await sharp(req.file.buffer)
        .resize({ width: 300 }) 
        .jpeg({ quality: 70 }) 
        .toBuffer();

      await db.query('UPDATE appuser SET personalimage = $1 WHERE userid = $2', [compressedImageBuffer, userid]);

      res.status(200).json({ message: 'Profile image updated successfully' });
    } catch (error) {
      console.error('[ERROR] Updating profile image:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/get-profile-image/:userid', async (req, res) => {
  const { userid } = req.params;

  if (!userid || isNaN(userid) || userid <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const result = await db.query('SELECT personalimage FROM appuser WHERE userid = $1', [userid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const binaryImage = result.rows[0].personalimage;

    if (!binaryImage) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.status(200).send(binaryImage);
  } catch (error) {
    console.error('[ERROR] Retrieving profile image:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;
