const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyMembers: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      name: { type: String, trim: true, required: true },
      relation: { type: String, trim: true, required: true },
      aadhar: { type: String, trim: true },
      pan: { type: String, trim: true },
      passport: { type: String, trim: true },
      voterId: { type: String, trim: true },
      drivingLicense: { type: String, trim: true },
      fileUrl: { type: String, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

familySchema.pre('save', function (next) {
  if (!this.userId) {
    return next(new Error('userId is required'));
  }
  next();
});

module.exports = mongoose.model('Family', familySchema);