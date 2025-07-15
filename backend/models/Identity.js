const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personalData: {
    LegalName: { type: String, trim: true },
    AlternateName: { type: String, trim: true },
    DateOfBirth: { type: String, trim: true },
    PlaceOfBirth: { type: String, trim: true },
  },
  identityData: [
    {
      documentType: { type: String, trim: true },
      documentNumber: { type: String, trim: true },
      fileUrl: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

identitySchema.pre('save', function (next) {
  if (!this.userId) {
    return next(new Error('userId is required'));
  }
  next();
});

module.exports = mongoose.model('Identity', identitySchema);