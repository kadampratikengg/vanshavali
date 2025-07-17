const Property = require('../models/Property');

exports.createProperty = async (req, res) => {
  try {
    const { propertyData } = req.body;
    const parsedPropertyData = typeof propertyData === 'string' ? JSON.parse(propertyData) : propertyData;
    const fileUrls = req.uploadcareUuids || [];

    const updatedPropertyData = {
      PropertyDetails: parsedPropertyData.PropertyDetails.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : null,
      })),
      VehicleDetails: parsedPropertyData.VehicleDetails.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : null,
      })),
      TransactionDetails: parsedPropertyData.TransactionDetails.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : null,
      })),
    };

    const property = new Property({
      userId: req.user.id,
      propertyData: updatedPropertyData,
    });

    await property.save();
    res.status(201).json({ message: 'Property data saved', property });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save property data', error: error.message });
  }
};

exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ userId: req.user.id });
    if (!property) {
      return res.status(404).json({ message: 'Property data not found' });
    }
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch property data', error: error.message });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const { propertyData } = req.body;
    const parsedPropertyData = typeof propertyData === 'string' ? JSON.parse(propertyData) : propertyData;
    const fileUrls = req.uploadcareUuids || [];

    const updatedPropertyData = {
      PropertyDetails: parsedPropertyData.PropertyDetails.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : item.fileUrl,
      })),
      VehicleDetails: parsedPropertyData.VehicleDetails.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : item.fileUrl,
      })),
      TransactionDetails: parsedPropertyData.TransactionDetails.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : item.fileUrl,
      })),
    };

    const property = await Property.findOneAndUpdate(
      { userId: req.user.id },
      { propertyData: updatedPropertyData },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Property data updated', property });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update property data', error: error.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    await Property.deleteOne({ userId: req.user.id });
    res.status(200).json({ message: 'Property data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete property data', error: error.message });
  }
};