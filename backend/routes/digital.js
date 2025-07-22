const express = require('express');
const router = express.Router();
const digitalController = require('../controllers/digitalController');
const authMiddleware = require('../middleware/auth');

console.log('Digital routes loaded'); // Debug log

// Fetch all digital access documents
router.get('/', authMiddleware, digitalController.getDigitalData);

// Add a new digital access document
router.post('/document', authMiddleware, digitalController.addDigitalDocument);

// Delete a digital access document
router.delete('/document/:id', authMiddleware, digitalController.deleteDigitalDocument);

module.exports = router;