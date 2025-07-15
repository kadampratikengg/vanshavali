const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const uploadcareMiddleware = require('../middleware/uploadcare');
const { createProperty, getProperty, updateProperty, deleteProperty } = require('../controllers/propertyController');

router.post('/', authMiddleware, uploadcareMiddleware, createProperty);
router.get('/', authMiddleware, getProperty);
router.put('/', authMiddleware, uploadcareMiddleware, updateProperty);
router.delete('/', authMiddleware, deleteProperty);

module.exports = router;