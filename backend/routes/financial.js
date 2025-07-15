const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const uploadcareMiddleware = require('../middleware/uploadcare');
const { createFinancial, getFinancial, updateFinancial, deleteFinancial } = require('../controllers/financialController');

router.post('/', authMiddleware, uploadcareMiddleware, createFinancial);
router.get('/', authMiddleware, getFinancial);
router.put('/', authMiddleware, uploadcareMiddleware, updateFinancial);
router.delete('/', authMiddleware, deleteFinancial);

module.exports = router;