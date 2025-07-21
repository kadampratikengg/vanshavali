const Education = require('../models/Education');
const mongoose = require('mongoose');

// Log when educationController is loaded
console.log('Education controller loaded');

const getEducation = async (req, res) => {
  try {
    console.log(`GET /education request for userId: ${req.user.id}`);
    const education = await Education.findOne({ userId: req.user.id });
    if (!education) {
      console.log(`No education data found for userId: ${req.user.id}`);
      return res.status(200).json({ educationData: { Education: [], Employment: [] } });
    }
    res.status(200).json({ educationData: education });
  } catch (error) {
    console.error('GET /education error:', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createEducationDocument = async (req, res) => {
  try {
    const { level, number, dateOfPassing, companyName, joinDate, exitDate, fileUrl } = req.body;

    console.log('POST /education/document processing:', { level, number, dateOfPassing, companyName, joinDate, exitDate, fileUrl, userId: req.user.id });

    // Validate inputs based on section
    let newDocument;
    if (level || number || dateOfPassing) {
      if (!level || level === 'Select Level' || !fileUrl) {
        console.log('Validation failed for Education:', { level, fileUrl });
        return res.status(400).json({ message: 'Level and file URL are required for Education' });
      }
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        level,
        number: number || '',
        dateOfPassing: dateOfPassing || '',
        fileUrl,
      };
    } else if (companyName || joinDate || exitDate) {
      if (!companyName || !fileUrl) {
        console.log('Validation failed for Employment:', { companyName, fileUrl });
        return res.status(400).json({ message: 'Company name and file URL are required for Employment' });
      }
      newDocument = {
        _id: new mongoose.Types.ObjectId(),
        companyName,
        joinDate: joinDate || '',
        exitDate: exitDate || '',
        fileUrl,
      };
    } else {
      console.log('Validation failed: Insufficient data provided');
      return res.status(400).json({ message: 'Insufficient data provided' });
    }

    let education = await Education.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!education) {
      console.log(`No education record found for userId: ${req.user.id}, creating new one`);
      education = new Education({ userId: new mongoose.Types.ObjectId(req.user.id), Education: [], Employment: [] });
    }

    if (level) {
      education.Education.push(newDocument);
    } else {
      education.Employment.push(newDocument);
    }
    await education.save();

    // Verify the saved document
    const savedEducation = await Education.findOne({ userId: req.user.id });
    const savedDoc = level
      ? savedEducation.Education.find(doc => doc._id.toString() === newDocument._id.toString())
      : savedEducation.Employment.find(doc => doc._id.toString() === newDocument._id.toString());

    if (!savedDoc) {
      console.error('Failed to verify saved document in database for userId:', req.user.id);
      throw new Error('Failed to verify saved document in database');
    }

    console.log('Document saved successfully:', savedDoc);
    res.status(201).json({
      message: 'Education document added',
      document: savedDoc,
    });
  } catch (error) {
    console.error('POST /education/document error:', { error: error.message, userId: req.user.id, body: req.body });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateEducation = async (req, res) => {
  try {
    const { educationData } = req.body;
    console.log('PUT /education received:', { educationData, userId: req.user.id });

    if (!educationData || !educationData.Education || !educationData.Employment) {
      console.log('Validation failed: Invalid education data structure');
      return res.status(400).json({ message: 'Invalid education data structure' });
    }

    const updatedEducation = await Education.findOneAndUpdate(
      { userId: req.user.id },
      { Education: educationData.Education, Employment: educationData.Employment },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Education data updated', educationData: updatedEducation });
  } catch (error) {
    console.error('PUT /education error:', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to update education data', error: error.message });
  }
};

const deleteEducationDocument = async (req, res) => {
  try {
    console.log(`DELETE /education/document/${req.params.id} request for userId: ${req.user.id}`);
    const education = await Education.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!education) {
      console.log(`No education data found for userId: ${req.user.id}`);
      return res.status(404).json({ message: 'Education data not found' });
    }

    const initialEducationLength = education.Education.length;
    const initialEmploymentLength = education.Employment.length;

    education.Education = education.Education.filter(doc => doc._id.toString() !== req.params.id);
    education.Employment = education.Employment.filter(doc => doc._id.toString() !== req.params.id);

    if (education.Education.length === initialEducationLength && education.Employment.length === initialEmploymentLength) {
      console.log(`No document found with id: ${req.params.id}`);
      return res.status(404).json({ message: 'Document not found' });
    }

    await education.save();
    console.log(`Document ${req.params.id} deleted successfully`);
    res.status(200).json({ message: 'Education document deleted' });
  } catch (error) {
    console.error('DELETE /education/document/:id error:', { error: error.message, userId: req.user.id, documentId: req.params.id });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getEducation,
  createEducationDocument,
  updateEducation,
  deleteEducationDocument
};
