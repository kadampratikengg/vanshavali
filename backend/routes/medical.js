const express = require('express');
const router = express.Router();
const medicalController = require('../controllers/medicalController');
const authenticateToken = require('../middleware/auth');

// Log when medical routes are loaded
console.log('Medical routes loaded');

router.get('/', authenticateToken, medicalController.getMedical);
router.post('/document', authenticateToken, (req, res, next) => {
  console.log('Received POST /medical/document request');
  medicalController.createMedicalDocument(req, res, next);
});
router.put('/', authenticateToken, medicalController.updateMedical);
router.delete('/document/:id', authenticateToken, medicalController.deleteMedicalDocument);

module.exports = router;