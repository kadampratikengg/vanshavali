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
    console.error('GET /property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { propertyData } = req.body;
    if (!propertyData) {
      return res.status(400).json({ message: 'propertyData is required' });
    }
    const property = await Property.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { propertyData } },
      { new: true, upsert: true }
    );
    res.status(201).json({ message: 'Property data saved', property });
  } catch (error) {
    console.error('POST /property error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      propertyData: req.body.propertyData,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const { propertyData } = req.body;
    if (!propertyData) {
      return res.status(400).json({ message: 'propertyData is required' });
    }
    const updatedPropertyData = {
      PropertyDetails: propertyData.PropertyDetails.map(item => ({
        _id: item.id && mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : new mongoose.Types.ObjectId(),
        propertyNumber: item.propertyNumber,
        areaAddress: item.areaAddress,
        pincode: item.pincode,
        landType: item.landType,
        fileUrl: item.fileUrl,
      })),
      VehicleDetails: propertyData.VehicleDetails.map(item => ({
        _id: item.id && mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : new mongoose.Types.ObjectId(),
        vehicleNumber: item.vehicleNumber,
        vehicleModel: item.vehicleModel,
        vehicleInsurance: item.vehicleInsurance,
        fileUrl: item.fileUrl,
      })),
      TransactionDetails: propertyData.TransactionDetails.map(item => ({
        _id: item.id && mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : new mongoose.Types.ObjectId(),
        type: item.type,
        documentNumber: item.documentNumber,
        details: item.details,
        fileUrl: item.fileUrl,
      })),
    };
    const property = await Property.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { propertyData: updatedPropertyData } },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Property data updated', property });
  } catch (error) {
    console.error('PUT /property error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      propertyData: req.body.propertyData,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/document', authenticateToken, async (req, res) => {
  try {
    const { propertyNumber, areaAddress, pincode, landType, vehicleNumber, vehicleModel, vehicleInsurance, type, documentNumber, details, fileUrl } = req.body;
    if (!fileUrl || (!propertyNumber && !vehicleNumber && !type)) {
      return res.status(400).json({ message: 'File URL and at least one relevant field are required' });
    }
    let property = await Property.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!property) {
      property = new Property({ userId: new mongoose.Types.ObjectId(req.user.id), propertyData: { PropertyDetails: [], VehicleDetails: [], TransactionDetails: [] } });
    }
    let section;
    let newDocument;
    if (propertyNumber || areaAddress || pincode || landType) {
      section = 'PropertyDetails';
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        propertyNumber,
        areaAddress,
        pincode,
        landType,
        fileUrl,
      };
    } else if (vehicleNumber || vehicleModel || vehicleInsurance) {
      section = 'VehicleDetails';
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        vehicleNumber,
        vehicleModel,
        vehicleInsurance,
        fileUrl,
      };
    } else {
      section = 'TransactionDetails';
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        type,
        documentNumber,
        details,
        fileUrl,
      };
    }
    property.propertyData[section].push(newDocument);
    await property.save();
    res.status(201).json({ message: 'Document added', document: newDocument });
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