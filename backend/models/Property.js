const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyDetails: [
    {
      propertyNumber: String,
      areaAddress: String,
      pincode: String,
      landType: String,
      fileUrl: String,
    },
  ],
  vehicleDetails: [
    {
      vehicleNumber: String,
      vehicleModel: String,
      vehicleInsurance: String,
      fileUrl: String,
    },
  ],
  transactionDetails: [
    {
      type: String,
      documentNumber: String,
      details: String,
      fileUrl: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Property', propertySchema);