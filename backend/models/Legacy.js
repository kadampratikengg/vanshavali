const mongoose = require('mongoose');

const legacySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  fileUrl: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Legacy', legacySchema);