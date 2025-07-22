const express = require('express');
const router = express.Router();
const legacyController = require('../controllers/legacyController');
const authMiddleware = require('../middleware/auth');

console.log('Legacy routes loaded'); // Debug log

// Fetch all legacy documents
router.get('/', authMiddleware, legacyController.getLegacyData);

// Add a new legacy document
router.post('/document', authMiddleware, legacyController.addLegacyDocument);

// Delete a legacy document
router.delete('/document/:id', authMiddleware, legacyController.deleteLegacyDocument);

module.exports = router;