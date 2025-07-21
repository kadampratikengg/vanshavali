const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Education: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      level: { type: String, trim: true, required: true },
      number: { type: String, trim: true },
      dateOfPassing: { type: String, trim: true },
      fileUrl: { type: String, required: true },
    },
  ],
  Employment: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      companyName: { type: String, trim: true, required: true },
      joinDate: { type: String, trim: true },
      exitDate: { type: String, trim: true },
      fileUrl: { type: String, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

educationSchema.pre('save', function (next) {
  if (!this.userId) {
    return next(new Error('userId is required'));
  }
  next();
});

module.exports = mongoose.model('Education', educationSchema);