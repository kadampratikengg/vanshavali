const mongoose = require('mongoose');

const financialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  BankDetails: [
    {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
      fileUrl: { type: String },
    },
  ],
  FixedDeposits: [
    {
      bankName: { type: String, trim: true },
      fdAccountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
      fileUrl: { type: String },
    },
  ],
  MutualFunds: [
    {
      schemeName: { type: String, trim: true },
      fundManager: { type: String, trim: true },
      typeOfScheme: { type: String, trim: true },
      fileUrl: { type: String },
    },
  ],
  PfDetails: { type: String, trim: true },
  InsurancePolicies: [
    {
      policyName: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
      fileUrl: { type: String },
    },
  ],
  BusinessOwnership: [
    {
      businessName: { type: String, trim: true },
      investment: { type: String, trim: true },
      fileUrl: { type: String },
    },
  ],
  CryptoAccounts: [
    {
      vendor: { type: String, trim: true },
      accountName: { type: String, trim: true },
      fileUrl: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

financialSchema.pre('save', function (next) {
  if (!this.userId) {
    return next(new Error('userId is required'));
  }
  next();
});

module.exports = mongoose.model('Financial', financialSchema);