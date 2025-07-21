const express = require('express');
const router = express.Router();
const Family = require('../models/Family');
const authenticateToken = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /family request for userId: ${req.user.id}`);
    const family = await Family.findOne({ userId: req.user.id });
    if (!family) {
      console.log(`No family data found for userId: ${req.user.id}`);
      return res.status(200).json({ familyMembers: [] });
    }
    res.status(200).json({ familyMembers: family.familyMembers });
  } catch (error) {
    console.error('GET /family error:', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/document', authenticateToken, async (req, res) => {
  try {
    const { name, relation, aadhar, pan, passport, voterId, drivingLicense, fileUrl } = req.body;

    console.log('POST /family/document received:', { name, relation, aadhar, pan, passport, voterId, drivingLicense, fileUrl, userId: req.user.id });

    // Validate inputs
    if (!name || relation === 'Select Relation' || !fileUrl) {
      console.log('Validation failed:', { name, relation, fileUrl });
      return res.status(400).json({ message: 'Name, valid relation, and file URL are required' });
    }

    let family = await Family.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!family) {
      console.log(`No family record found for userId: ${req.user.id}, creating new one`);
      family = new Family({ userId: new mongoose.Types.ObjectId(req.user.id), familyMembers: [] });
    }

    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      name,
      relation,
      aadhar: aadhar || '',
      pan: pan || '',
      passport: passport || '',
      voterId: voterId || '',
      drivingLicense: drivingLicense || '',
      fileUrl,
    };

    family.familyMembers.push(newDocument);
    await family.save();

    // Verify the saved document
    const savedFamily = await Family.findOne({ userId: req.user.id });
    const savedDoc = savedFamily.familyMembers.find(doc => doc._id.toString() === newDocument._id.toString());

    if (!savedDoc) {
      console.error('Failed to verify saved document in database for userId:', req.user.id);
      throw new Error('Failed to verify saved document in database');
    }

    console.log('Document saved successfully:', savedDoc);
    res.status(201).json({
      message: 'Family member added',
      document: {
        _id: savedDoc._id,
        name: savedDoc.name,
        relation: savedDoc.relation,
        aadhar: savedDoc.aadhar || '',
        pan: savedDoc.pan || '',
        passport: savedDoc.passport || '',
        voterId: savedDoc.voterId || '',
        drivingLicense: savedDoc.drivingLicense || '',
        fileUrl: savedDoc.fileUrl,
      },
    });
  } catch (error) {
    console.error('POST /family/document error:', { error: error.message, userId: req.user.id, body: req.body });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/document/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`DELETE /family/document/${req.params.id} request for userId: ${req.user.id}`);
    const family = await Family.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!family) {
      console.log(`No family data found for userId: ${req.user.id}`);
      return res.status(404).json({ message: 'Family data not found' });
    }
    const initialLength = family.familyMembers.length;
    family.familyMembers = family.familyMembers.filter(doc => doc._id.toString() !== req.params.id);
    if (family.familyMembers.length === initialLength) {
      console.log(`No document found with id: ${req.params.id}`);
      return res.status(404).json({ message: 'Document not found' });
    }
    await family.save();
    console.log(`Document ${req.params.id} deleted successfully`);
    res.status(200).json({ message: 'Family member deleted' });
  } catch (error) {
    console.error('DELETE /family/document/:id error:', { error: error.message, userId: req.user.id, documentId: req.params.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;