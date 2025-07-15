const Identity = require('../models/Identity');

exports.createIdentity = async (req, res) => {
  try {
    const { personalData, identityData } = req.body;
    const parsedPersonalData = typeof personalData === 'string' ? JSON.parse(personalData) : personalData;
    const parsedIdentityData = typeof identityData === 'string' ? JSON.parse(identityData) : identityData;
    const fileUrls = req.uploadcareUuids || [];

    const updatedIdentityData = parsedIdentityData.map((item, index) => ({
      ...item,
      fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : null,
    }));

    const identity = new Identity({
      userId: req.user.id,
      personalData: parsedPersonalData,
      identityData: updatedIdentityData,
    });

    await identity.save();
    res.status(201).json({ message: 'Identity data saved', identity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save identity data', error: error.message });
  }
};

exports.getIdentity = async (req, res) => {
  try {
    const identity = await Identity.findOne({ userId: req.user.id });
    if (!identity) {
      return res.status(404).json({ message: 'Identity data not found' });
    }
    res.status(200).json(identity);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch identity data', error: error.message });
  }
};

exports.updateIdentity = async (req, res) => {
  try {
    const { personalData, identityData } = req.body;
    const parsedPersonalData = typeof personalData === 'string' ? JSON.parse(personalData) : personalData;
    const parsedIdentityData = typeof identityData === 'string' ? JSON.parse(identityData) : identityData;
    const fileUrls = req.uploadcareUuids || [];

    const updatedIdentityData = parsedIdentityData.map((item, index) => ({
      ...item,
      fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : item.fileUrl,
    }));

    const identity = await Identity.findOneAndUpdate(
      { userId: req.user.id },
      { personalData: parsedPersonalData, identityData: updatedIdentityData },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Identity data updated', identity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update identity data', error: error.message });
  }
};

exports.deleteIdentity = async (req, res) => {
  try {
    await Identity.deleteOne({ userId: req.user.id });
    res.status(200).json({ message: 'Identity data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete identity data', error: error.message });
  }
};