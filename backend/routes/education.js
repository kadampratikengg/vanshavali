const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');
const authenticateToken = require('../middleware/auth');

// Log when education routes are loaded
console.log('Education routes loaded');

router.get('/', authenticateToken, (req, res, next) => {
  console.log('Received GET /education request');
  if (!educationController.getEducation) {
    console.error('educationController.getEducation is undefined');
    return res.status(500).json({ message: 'Server error: Education controller not properly initialized' });
  }
  educationController.getEducation(req, res, next);
});
router.post('/document', authenticateToken, (req, res, next) => {
  console.log('Received POST /education/document request');
  educationController.createEducationDocument(req, res, next);
});
router.put('/', authenticateToken, (req, res, next) => {
  console.log('Received PUT /education request');
  educationController.updateEducation(req, res, next);
});
router.delete('/document/:id', authenticateToken, (req, res, next) => {
  console.log(`Received DELETE /education/document/${req.params.id} request`);
  educationController.deleteEducationDocument(req, res, next);
});

module.exports = router;