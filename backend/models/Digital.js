const mongoose = require('mongoose');

const digitalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Mobile Numbers',
      'Email Accounts',
      'Social Media',
      'Online Banking',
      'Subscriptions',
      'Cloud Storage',
      'Website Domains',
    ],
  },
  details: {
    type: String,
    required: true,
  },
  remark: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Digital', digitalSchema);