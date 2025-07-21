const Medical = require('../models/Medical');
const mongoose = require('mongoose');

exports.getMedical = async (req, res) => {
  try {
    console.log(`GET /medical request for userId: ${req.user.id}`);
    const medical = await Medical.findOne({ userId: req.user.id });
    if (!medical) {
      console.log(`No medical data found for userId: ${req.user.id}`);
      return res.status(200).json({ medicalData: { MedicalHistory: [], MedicalInsurance: [] } });
    }
    res.status(200).json({ medicalData: medical });
  } catch (error) {
    console.error('GET /medical error:', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createMedicalDocument = async (req, res) => {
  try {
    const { condition, bloodGroup, height, weight, provider, policyNumber, expiryDate, fileUrl } = req.body;

    console.log('POST /medical/document processing:', { condition, bloodGroup, height, weight, provider, policyNumber, expiryDate, fileUrl, userId: req.user.id });

    // Validate inputs based on section
    let newDocument;
    if (condition || bloodGroup || height || weight) {
      if (!condition || bloodGroup === 'Select Blood Group' || !fileUrl) {
        console.log('Validation failed for MedicalHistory:', { condition, bloodGroup, fileUrl });
        return res.status(400).json({ message: 'Condition, valid blood group, and file URL are required for Medical History' });
      }
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        condition,
        bloodGroup,
        height: height || '',
        weight: weight || '',
        fileUrl,
      };
    } else if (provider || policyNumber || expiryDate) {
      if (!provider || !fileUrl) {
        console.log('Validation failed for MedicalInsurance:', { provider, fileUrl });
        return res.status(400).json({ message: 'Provider and file URL are required for Medical Insurance' });
      }
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        provider,
        policyNumber: policyNumber || '',
        expiryDate: expiryDate || '',
        fileUrl,
      };
    } else {
      console.log('Validation failed: Insufficient data provided');
      return res.status(400).json({ message: 'Insufficient data provided' });
    }

    let medical = await Medical.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!medical) {
      console.log(`No medical record found for userId: ${req.user.id}, creating new one`);
      medical = new Medical({ userId: new mongoose.Types.ObjectId(req.user.id), MedicalHistory: [], MedicalInsurance: [] });
    }

    if (condition) {
      medical.MedicalHistory.push(newDocument);
    } else {
      medical.MedicalInsurance.push(newDocument);
    }
    await medical.save();

    // Verify the saved document
    const savedMedical = await Medical.findOne({ userId: req.user.id });
    const savedDoc = condition
      ? savedMedical.MedicalHistory.find(doc => doc._id.toString() === newDocument._id.toString())
      : savedMedical.MedicalInsurance.find(doc => doc._id.toString() === newDocument._id.toString());

    if (!savedDoc) {
      console.error('Failed to verify saved document in database for userId:', req.user.id);
      throw new Error('Failed to verify saved document in database');
    }

    console.log('Document saved successfully:', savedDoc);
    res.status(201).json({
      message: 'Medical document added',
      document: savedDoc,
    });
  } catch (error) {
    console.error('POST /medical/document error:', { error: error.message, userId: req.user.id, body: req.body });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateMedical = async (req, res) => {
  try {
    const { medicalData } = req.body;
    console.log('PUT /medical received:', { medicalData, userId: req.user.id });

    if (!medicalData || !medicalData.MedicalHistory || !medicalData.MedicalInsurance) {
      console.log('Validation failed: Invalid medical data structure');
      return res.status(400).json({ message: 'Invalid medical data structure' });
    }

    const updatedMedical = await Medical.findOneAndUpdate(
      { userId: req.user.id },
      { MedicalHistory: medicalData.MedicalHistory, MedicalInsurance: medicalData.MedicalInsurance },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Medical data updated', medicalData: updatedMedical });
  } catch (error) {
    console.error('PUT /medical error:', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to update medical data', error: error.message });
  }
};

exports.deleteMedicalDocument = async (req, res) => {
  try {
    console.log(`DELETE /medical/document/${req.params.id} request for userId: ${req.user.id}`);
    const medical = await Medical.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!medical) {
      console.log(`No medical data found for userId: ${req.user.id}`);
      return res.status(404).json({ message: 'Medical data not found' });
    }

    const initialHistoryLength = medical.MedicalHistory.length;
    const initialInsuranceLength = medical.MedicalInsurance.length;

    medical.MedicalHistory = medical.MedicalHistory.filter(doc => doc._id.toString() !== req.params.id);
    medical.MedicalInsurance = medical.MedicalInsurance.filter(doc => doc._id.toString() !== req.params.id);

    if (medical.MedicalHistory.length === initialHistoryLength && medical.MedicalInsurance.length === initialInsuranceLength) {
      console.log(`No document found with id: ${req.params.id}`);
      return res.status(404).json({ message: 'Document not found' });
    }

    await medical.save();
    console.log(`Document ${req.params.id} deleted successfully`);
    res.status(200).json({ message: 'Medical document deleted' });
  } catch (error) {
    console.error('DELETE /medical/document/:id error:', { error: error.message, userId: req.user.id, documentId: req.params.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};