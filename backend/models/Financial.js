const mongoose = require('mongoose');

const financialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  financialData: {
    Banking: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        accountNumber: { type: String, trim: true },
        type: { type: String, trim: true },
        remark: { type: String, trim: true },
        fileUrl: { type: String },
      },
    ],
    Investments: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: { type: String, trim: true },
        type: { type: String, trim: true },
        remark: { type: String, trim: true },
        fileUrl: { type: String },
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

financialSchema.pre('save', function (next) {
  if (!this.userId) {
    return next(new Error('userId is required'));
  }
  next();
});

module.exports = mongoose.model('Financial', financialSchema);