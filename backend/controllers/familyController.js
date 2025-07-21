const Family = require('../models/Family');

exports.createFamily = async (req, res) => {
  try {
    const { name, relation, aadhar, pan, passport, voterId, drivingLicense, fileUrl } = req.body;
    if (!name || relation === 'Select Relation' || !fileUrl) {
      return res.status(400).json({ message: 'Name, valid relation, and file URL are required' });
    }
    let family = await Family.findOne({ userId: req.user.id });
    if (!family) {
      family = new Family({
        userId: req.user.id,
        familyMembers: [],
      });
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
    res.status(201).json({ message: 'Family member added', document: newDocument });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save family member', error: error.message });
  }
};

exports.getFamily = async (req, res) => {
  try {
    const family = await Family.findOne({ userId: req.user.id });
    if (!family) {
      return res.status(404).json({ message: 'Family data not found' });
    }
    res.status(200).json(family);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch family data', error: error.message });
  }
};

exports.updateFamily = async (req, res) => {
  try {
    const { familyMembers } = req.body;
    const parsedFamilyMembers = typeof familyMembers === 'string' ? JSON.parse(familyMembers) : familyMembers;
    const fileUrls = req.uploadcareUuids || [];

    const updatedFamilyMembers = parsedFamilyMembers.map((item, index) => ({
      ...item,
      fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : item.fileUrl,
    }));

    const family = await Family.findOneAndUpdate(
      { userId: req.user.id },
      { familyMembers: updatedFamilyMembers },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Family data updated', family });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update family data', error: error.message });
  }
};

exports.deleteFamily = async (req, res) => {
  try {
    await Family.deleteOne({ userId: req.user.id });
    res.status(200).json({ message: 'Family data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete family data', error: error.message });
  }
};