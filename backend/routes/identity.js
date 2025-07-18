const express = require('express');
const router = express.Router();
const Identity = require('../models/Identity');
const authenticateToken = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: req.user.id });
    if (!identity) {
      return res.status(200).json({
        personalData: { LegalName: '', AlternateName: '', DateOfBirth: '', PlaceOfBirth: '' },
        identityData: { Government: [], Other: [] }
      });
    }
    res.status(200).json({
      personalData: identity.personalData || { LegalName: '', AlternateName: '', DateOfBirth: '', PlaceOfBirth: '' },
      identityData: identity.identityData || { Government: [], Other: [] }
    });
  } catch (error) {
    console.error('GET /identity error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { personalData } = req.body;
    if (!personalData) {
      return res.status(400).json({ message: 'personalData is required' });
    }
    const identity = await Identity.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { personalData } },
      { new: true, upsert: true }
    );
    res.status(201).json({ message: 'Personal data saved', identity });
  } catch (error) {
    console.error('POST /identity error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      personalData: req.body.personalData,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/document', authenticateToken, async (req, res) => {
  try {
    const { documentType, documentNumber, fileUrl } = req.body;
    if (!documentType || documentType === 'Select Document' || !fileUrl) {
      return res.status(400).json({ message: 'Document type and file URL are required' });
    }
    let identity = await Identity.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!identity) {
      identity = new Identity({
        userId: new mongoose.Types.ObjectId(req.user.id),
        personalData: { LegalName: '', AlternateName: '', DateOfBirth: '', PlaceOfBirth: '' },
        identityData: { Government: [], Other: [] }
      });
    }
    const section = ['Aadhar', 'Pan', 'Voter Id', 'Passport', 'Driving License'].includes(documentType)
      ? 'Government'
      : 'Other';
    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      documentType,
      documentNumber,
      fileUrl,
    };
    identity.identityData[section].push(newDocument);
    await identity.save();
    res.status(201).json({ message: 'Document added', document: newDocument });
  } catch (error) {
    console.error('POST /identity/document error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      body: req.body,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const { identityData } = req.body;
    if (!identityData) {
      return res.status(400).json({ message: 'identityData is required' });
    }
    const updatedIdentityData = {
      Government: identityData.Government.map(item => ({
        _id: item.id && mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : new mongoose.Types.ObjectId(),
        documentType: item.documentType,
        documentNumber: item.documentNumber,
        fileUrl: item.fileUrl,
      })),
      Other: identityData.Other.map(item => ({
        _id: item.id && mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : new mongoose.Types.ObjectId(),
        documentType: item.documentType,
        documentNumber: item.documentNumber,
        fileUrl: item.fileUrl,
      })),
    };
    const identity = await Identity.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { identityData: updatedIdentityData } },
      { new: true, upsert: true }
    );
    res.status(200).json({
      message: 'Identity data updated',
      identity: {
        personalData: identity.personalData || { LegalName: '', AlternateName: '', DateOfBirth: '', PlaceOfBirth: '' },
        identityData: identity.identityData
      }
    });
  } catch (error) {
    console.error('PUT /identity error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      identityData: req.body.identityData,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/document/:id', authenticateToken, async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!identity) {
      return res.status(404).json({ message: 'Identity data not found' });
    }
    identity.identityData.Government = identity.identityData.Government.filter(doc => doc._id.toString() !== req.params.id);
    identity.identityData.Other = identity.identityData.Other.filter(doc => doc._id.toString() !== req.params.id);
    await identity.save();
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    console.error('DELETE /identity/document/:id error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      documentId: req.params.id,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;