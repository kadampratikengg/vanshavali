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
    console.error('GET /financial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { financialData } = req.body;
    if (!financialData) {
      return res.status(400).json({ message: 'financialData is required' });
    }
    const financial = await Financial.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { financialData } },
      { new: true, upsert: true }
    );
    res.status(201).json({ message: 'Financial data saved', financial });
  } catch (error) {
    console.error('POST /financial error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      financialData: req.body.financialData,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const { financialData } = req.body;
    if (!financialData) {
      return res.status(400).json({ message: 'financialData is required' });
    }
    const updatedFinancialData = {
      Banking: financialData.Banking.map(item => ({
        _id: item.id && mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : new mongoose.Types.ObjectId(),
        type: item.type,
        bankName: item.bankName,
        accountNumber: item.accountNumber,
        ifsc: item.ifsc,
        fileUrl: item.fileUrl,
      })),
      Investments: financialData.Investments.map(item => ({
        _id: item.id && mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : new mongoose.Types.ObjectId(),
        type: item.type,
        name: item.name,
        detail: item.detail,
        fileUrl: item.fileUrl,
      })),
    };
    const financial = await Financial.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { financialData: updatedFinancialData } },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Financial data updated', financial });
  } catch (error) {
    console.error('PUT /financial error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      financialData: req.body.financialData,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/document', authenticateToken, async (req, res) => {
  try {
    const { type, bankName, accountNumber, ifsc, name, detail, fileUrl } = req.body;
    if (!type || type === 'Select Type' || !fileUrl) {
      return res.status(400).json({ message: 'Type and file URL are required' });
    }
    let financial = await Financial.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!financial) {
      financial = new Financial({ userId: new mongoose.Types.ObjectId(req.user.id), financialData: { Banking: [], Investments: [] } });
    }
    const section = bankName ? 'Banking' : 'Investments';
    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      type,
      ...(section === 'Banking' ? { bankName, accountNumber, ifsc } : { name, detail }),
      fileUrl,
    };
    financial.financialData[section].push(newDocument);
    await financial.save();
    res.status(201).json({ message: 'Document added', document: newDocument });
  } catch (error) {
    console.error('POST /financial/document error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      body: req.body,
    });
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
    console.error('DELETE /financial/document/:id error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      documentId: req.params.id,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;