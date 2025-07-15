const Property = require('../models/Property');

exports.createProperty = async (req, res) => {
  try {
    const { propertyDetails, vehicleDetails, transactionDetails } = req.body;
    const fileUrls = req.uploadcareUuids || [];

    const updateDetails = (details, sectionFiles) => {
      let fileIndex = 0;
      return details.map((item) => {
        if (sectionFiles && sectionFiles[fileIndex]) {
          return { ...item, fileUrl: `https://ucarecdn.com/${sectionFiles[fileIndex++]}/` };
        }
        return item;
      });
    };

    const property = new Property({
      userId: req.user.id,
      propertyDetails: updateDetails(propertyDetails, fileUrls.slice(0, propertyDetails.length)),
      vehicleDetails: updateDetails(vehicleDetails, fileUrls.slice(propertyDetails.length, propertyDetails.length + vehicleDetails.length)),
      transactionDetails: updateDetails(transactionDetails, fileUrls.slice(propertyDetails.length + vehicleDetails.length)),
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
    const { propertyDetails, vehicleDetails, transactionDetails } = req.body;
    const fileUrls = req.uploadcareUuids || [];

    const updateDetails = (details, sectionFiles) => {
      let fileIndex = 0;
      return details.map((item) => {
        if (sectionFiles && sectionFiles[fileIndex]) {
          return { ...item, fileUrl: `https://ucarecdn.com/${sectionFiles[fileIndex++]}/` };
        }
        return item;
      });
    };

    const property = await Property.findOneAndUpdate(
      { userId: req.user.id },
      {
        propertyDetails: updateDetails(propertyDetails, fileUrls.slice(0, propertyDetails.length)),
        vehicleDetails: updateDetails(vehicleDetails, fileUrls.slice(propertyDetails.length, propertyDetails.length + vehicleDetails.length)),
        transactionDetails: updateDetails(transactionDetails, fileUrls.slice(propertyDetails.length + vehicleDetails.length)),
      },
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