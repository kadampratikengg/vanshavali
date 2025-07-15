const express = require('express');
const router = express.Router();
const Identity = require('../models/Identity');
const authenticateToken = require('../middleware/auth');

// Get Identity Data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: req.user.id });
    if (!identity) {
      return res.status(404).json({ message: 'Identity data not found' });
    }
    res.status(200).json(identity);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or Update Identity Data
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { personalData, identityData } = req.body;
    const parsedPersonalData = typeof personalData === 'string' ? JSON.parse(personalData) : personalData;
    const parsedIdentityData = typeof identityData === 'string' ? JSON.parse(identityData) : identityData;
    const fileUrls = req.uploadcareUuids || [];

    const updatedIdentityData = parsedIdentityData.map((item, index) => ({
      ...item,
      fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : null,
    }));

    const identity = await Identity.findOneAndUpdate(
      { userId: req.user.id },
      { personalData: parsedPersonalData, identityData: updatedIdentityData },
      { new: true, upsert: true }
    );

    res.status(201).json({ message: 'Identity data saved', identity });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;