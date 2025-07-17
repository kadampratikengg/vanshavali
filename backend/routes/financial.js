const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const uploadcareMiddleware = require('../middleware/uploadcare');
const { createFinancial, getFinancial, updateFinancial, deleteFinancial, addFinancialDocument, deleteFinancialDocument } = require('../controllers/financialController');

router.post('/', authMiddleware, uploadcareMiddleware, createFinancial);
router.get('/', authMiddleware, getFinancial);
router.put('/', authMiddleware, uploadcareMiddleware, updateFinancial);
router.delete('/', authMiddleware, deleteFinancial);
router.post('/document', authMiddleware, uploadcareMiddleware, addFinancialDocument);
router.delete('/document/:id', authMiddleware, deleteFinancialDocument);

module.exports = router;