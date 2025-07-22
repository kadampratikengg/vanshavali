const Legacy = require('../models/Legacy');

exports.getLegacyData = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT token
    const legacyData = await Legacy.find({ userId });
    res.status(200).json({ legacyData });
  } catch (error) {
    console.error('Error fetching legacy data:', error);
    res.status(500).json({ message: 'Server error while fetching legacy data' });
  }
};

exports.addLegacyDocument = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT token
    const { type, message, fileUrl } = req.body;

    // Validate input
    if (!type || type === 'Select Type') {
      return res.status(400).json({ message: 'A valid type is required' });
    }
    if (!message && !fileUrl) {
      return res.status(400).json({ message: 'At least one text field or file is required' });
    }

    const newDocument = new Legacy({
      userId,
      type,
      message: message || '',
      fileUrl: fileUrl || '',
    });

    await newDocument.save();
    res.status(201).json({ document: newDocument });
  } catch (error) {
    console.error('Error adding legacy document:', error);
    res.status(500).json({ message: 'Server error while adding legacy document' });
  }
};

exports.deleteLegacyDocument = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT token
    const documentId = req.params.id;

    const document = await Legacy.findOne({ _id: documentId, userId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found or not authorized' });
    }

    await Legacy.deleteOne({ _id: documentId, userId });
    res.status(200).json({ message: 'Legacy document deleted successfully' });
  } catch (error) {
    console.error('Error deleting legacy document:', error);
    res.status(500).json({ message: 'Server error while deleting legacy document' });
  }
};