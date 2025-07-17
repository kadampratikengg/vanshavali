const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyData: {
    PropertyDetails: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        propertyNumber: { type: String, trim: true },
        areaAddress: { type: String, trim: true },
        pincode: { type: String, trim: true },
        landType: { type: String, trim: true },
        fileUrl: { type: String },
      },
    ],
    VehicleDetails: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        vehicleNumber: { type: String, trim: true },
        vehicleModel: { type: String, trim: true },
        vehicleInsurance: { type: String, trim: true },
        fileUrl: { type: String },
      },
    ],
    TransactionDetails: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        type: { type: String, trim: true },
        documentNumber: { type: String, trim: true },
        details: { type: String, trim: true },
        fileUrl: { type: String },
      },
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

propertySchema.pre('save', function (next) {
  if (!this.userId) {
    return next(new Error('userId is required'));
  }
  next();
});

module.exports = mongoose.model('Property', propertySchema);