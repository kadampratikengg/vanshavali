const mongoose = require('mongoose');

const medicalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  MedicalHistory: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      condition: { type: String, trim: true, required: true },
      bloodGroup: { type: String, trim: true, required: true },
      height: { type: String, trim: true },
      weight: { type: String, trim: true },
      fileUrl: { type: String, required: true },
    },
  ],
  MedicalInsurance: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      provider: { type: String, trim: true, required: true },
      policyNumber: { type: String, trim: true },
      expiryDate: { type: String, trim: true },
      fileUrl: { type: String, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

medicalSchema.pre('save', function (next) {
  if (!this.userId) {
    return next(new Error('userId is required'));
  }
  next();
});

module.exports = mongoose.model('Medical', medicalSchema);