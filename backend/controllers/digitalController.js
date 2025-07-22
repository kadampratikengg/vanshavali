const Digital = require('../models/Digital');

exports.getDigitalData = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT token
    const digitalData = await Digital.find({ userId });
    res.status(200).json({ digitalData });
  } catch (error) {
    console.error('Error fetching digital data:', error);
    res.status(500).json({ message: 'Server error while fetching digital data' });
  }
};

exports.addDigitalDocument = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT token
    const { type, details, remark } = req.body;

    if (!type || !details) {
      return res.status(400).json({ message: 'Type and details are required' });
    }

    const newDocument = new Digital({
      userId,
      type,
      details,
      remark: remark || '',
    });

    await newDocument.save();
    res.status(201).json({ document: newDocument });
  } catch (error) {
    console.error('Error adding digital document:', error);
    res.status(500).json({ message: 'Server error while adding digital document' });
  }
};

exports.deleteDigitalDocument = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT token
    const documentId = req.params.id;

    const document = await Digital.findOne({ _id: documentId, userId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found or not authorized' });
    }

    await Digital.deleteOne({ _id: documentId, userId });
    res.status(200).json({ message: 'Digital document deleted successfully' });
  } catch (error) {
    console.error('Error deleting digital document:', error);
    res.status(500).json({ message: 'Server error while deleting digital document' });
  }
};