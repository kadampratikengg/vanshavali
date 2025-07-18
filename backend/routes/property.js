const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const authenticateToken = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findOne({ userId: req.user.id });
    if (!property) {
      return res.status(200).json({ propertyData: { PropertyDetails: [], VehicleDetails: [], TransactionDetails: [] } });
    }
    res.status(200).json(property);
  } catch (error) {
    console.error('GET /property error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/document', authenticateToken, async (req, res) => {
  try {
    const { type, number, remark, fileUrl, section } = req.body;
    console.log('Received POST /property/document request:', {
      userId: req.user.id,
      body: { type, number, remark, fileUrl, section },
    });

    if (!fileUrl || !type || !number || !section) {
      console.warn('Validation failed: Missing required fields', { type, number, fileUrl, section });
      return res.status(400).json({ message: 'File URL, document type, number, and section are required' });
    }

    const validSections = ['Property Details', 'Vehicle Details', 'Sale, Purchase, Agreements, Rent Details'];
    if (!validSections.includes(section)) {
      console.warn('Validation failed: Invalid section', { section });
      return res.status(400).json({ message: `Invalid section. Must be one of: ${validSections.join(', ')}` });
    }

    let property = await Property.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!property) {
      console.log('No existing property found, creating new one for user:', req.user.id);
      property = new Property({ userId: new mongoose.Types.ObjectId(req.user.id), propertyData: { PropertyDetails: [], VehicleDetails: [], TransactionDetails: [] } });
    }

    let newDocument;
    if (section === 'Property Details') {
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        propertyNumber: number,
        areaAddress: remark || '',
        pincode: '',
        landType: type,
        fileUrl,
      };
      property.propertyData.PropertyDetails.push(newDocument);
    } else if (section === 'Vehicle Details') {
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        vehicleNumber: number,
        vehicleModel: remark || '',
        vehicleInsurance: type,
        fileUrl,
      };
      property.propertyData.VehicleDetails.push(newDocument);
    } else if (section === 'Sale, Purchase, Agreements, Rent Details') {
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        type,
        documentNumber: number,
        details: remark || '',
        fileUrl,
      };
      property.propertyData.TransactionDetails.push(newDocument);
    }

    try {
      await property.save();
      console.log('Document saved successfully:', newDocument);
    } catch (saveError) {
      console.error('Error saving document to MongoDB:', {
        error: saveError.message,
        stack: saveError.stack,
        document: newDocument,
      });
      throw saveError;
    }

    res.status(201).json({
      message: 'Document added',
      document: {
        _id: newDocument._id,
        section,
        type: newDocument.landType || newDocument.vehicleInsurance || newDocument.type,
        number: newDocument.propertyNumber || newDocument.vehicleNumber || newDocument.documentNumber,
        remark: newDocument.areaAddress || newDocument.vehicleModel || newDocument.details || '',
        fileUrl: newDocument.fileUrl,
      },
    });
  } catch (error) {
    console.error('POST /property/document error:', {
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
    const property = await Property.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!property) {
      return res.status(404).json({ message: 'Property data not found' });
    }
    property.propertyData.PropertyDetails = property.propertyData.PropertyDetails.filter(doc => doc._id.toString() !== req.params.id);
    property.propertyData.VehicleDetails = property.propertyData.VehicleDetails.filter(doc => doc._id.toString() !== req.params.id);
    property.propertyData.TransactionDetails = property.propertyData.TransactionDetails.filter(doc => doc._id.toString() !== req.params.id);
    await property.save();
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    console.error('DELETE /property/document/:id error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      documentId: req.params.id,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;