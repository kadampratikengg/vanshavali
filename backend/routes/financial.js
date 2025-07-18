const express = require('express');
const router = express.Router();
const Financial = require('../models/Financial');
const authenticateToken = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const financial = await Financial.findOne({ userId: req.user.id });
    if (!financial) {
      return res.status(200).json({ financialData: { Banking: [], Investments: [] } });
    }
    res.status(200).json(financial);
  } catch (error) {
    console.error('GET /financial error:', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/document', authenticateToken, async (req, res) => {
  try {
    const { type, number, remark, fileUrl, section } = req.body;

    // Validate inputs
    if (!fileUrl || !type || !number || !section) {
      return res.status(400).json({ message: 'File URL, document type, number, and section are required' });
    }
    if (type === 'Select Document') {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    const validSections = ['Banking', 'Investments'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: `Invalid section. Must be one of: ${validSections.join(', ')}` });
    }

    let financial = await Financial.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!financial) {
      financial = new Financial({ userId: new mongoose.Types.ObjectId(req.user.id), financialData: { Banking: [], Investments: [] } });
    }

    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      type,
      remark: remark || '',
      fileUrl,
      ...(section === 'Banking' ? { accountNumber: number } : { name: number }),
    };

    financial.financialData[section].push(newDocument);
    await financial.save();

    // Verify the saved document
    const savedFinancial = await Financial.findOne({ userId: req.user.id });
    const savedDoc = section === 'Banking'
      ? savedFinancial.financialData.Banking.find(doc => doc._id.toString() === newDocument._id.toString())
      : savedFinancial.financialData.Investments.find(doc => doc._id.toString() === newDocument._id.toString());

    if (!savedDoc) {
      throw new Error('Failed to verify saved document in database');
    }

    res.status(201).json({
      message: 'Document added',
      document: {
        _id: newDocument._id,
        section,
        type: newDocument.type,
        number: section === 'Banking' ? savedDoc.accountNumber : savedDoc.name,
        remark: savedDoc.remark || '',
        fileUrl: savedDoc.fileUrl,
      },
    });
  } catch (error) {
    console.error('POST /financial/document error:', { error: error.message, userId: req.user.id, body: req.body });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/document/:id', authenticateToken, async (req, res) => {
  try {
    const financial = await Financial.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    financial.financialData.Banking = financial.financialData.Banking.filter(doc => doc._id.toString() !== req.params.id);
    financial.financialData.Investments = financial.financialData.Investments.filter(doc => doc._id.toString() !== req.params.id);
    await financial.save();
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    console.error('DELETE /financial/document/:id error:', { error: error.message, userId: req.user.id, documentId: req.params.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;