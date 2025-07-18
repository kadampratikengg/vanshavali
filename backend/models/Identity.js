const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  personalData: {
    LegalName: { type: String, default: '' },
    AlternateName: { type: String, default: '' },
    DateOfBirth: { type: String, default: '' },
    PlaceOfBirth: { type: String, default: '' },
  },
  identityData: {
    Government: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      documentType: { type: String, required: true },
      documentNumber: { type: String, required: true },
      fileUrl: { type: String, required: true },
    }],
    Other: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      documentType: { type: String, required: true },
      documentNumber: { type: String, required: true },
      fileUrl: { type: String, required: true },
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Identity', identitySchema);