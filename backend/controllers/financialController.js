const Financial = require('../models/Financial');

exports.createFinancial = async (req, res) => {
  try {
    const { BankDetails, FixedDeposits, MutualFunds, PfDetails, InsurancePolicies, BusinessOwnership, CryptoAccounts } = req.body;
    const fileUrls = req.uploadcareUuids || [];

    const parseIfString = (data) => (typeof data === 'string' ? JSON.parse(data) : data);

    const updateDetails = (details, sectionFiles) => {
      let fileIndex = 0;
      return parseIfString(details).map((item) => {
        if (sectionFiles && sectionFiles[fileIndex]) {
          return { ...item, fileUrl: `https://ucarecdn.com/${sectionFiles[fileIndex++]}/` };
        }
        return item;
      });
    };

    const financial = new Financial({
      userId: req.user.id,
      BankDetails: updateDetails(BankDetails, fileUrls.slice(0, parseIfString(BankDetails).length)),
      FixedDeposits: updateDetails(FixedDeposits, fileUrls.slice(parseIfString(BankDetails).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length)),
      MutualFunds: updateDetails(MutualFunds, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length)),
      PfDetails: parseIfString(PfDetails),
      InsurancePolicies: updateDetails(InsurancePolicies, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length)),
      BusinessOwnership: updateDetails(BusinessOwnership, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length + parseIfString(BusinessOwnership).length)),
      CryptoAccounts: updateDetails(CryptoAccounts, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length + parseIfString(BusinessOwnership).length)),
    });

    await financial.save();
    res.status(201).json({ message: 'Financial data saved', financial });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save financial data', error: error.message });
  }
};

exports.getFinancial = async (req, res) => {
  try {
    const financial = await Financial.findOne({ userId: req.user.id });
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    res.status(200).json(financial);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch financial data', error: error.message });
  }
};

exports.updateFinancial = async (req, res) => {
  try {
    const { BankDetails, FixedDeposits, MutualFunds, PfDetails, InsurancePolicies, BusinessOwnership, CryptoAccounts } = req.body;
    const fileUrls = req.uploadcareUuids || [];

    const parseIfString = (data) => (typeof data === 'string' ? JSON.parse(data) : data);

    const updateDetails = (details, sectionFiles) => {
      let fileIndex = 0;
      return parseIfString(details).map((item) => {
        if (sectionFiles && sectionFiles[fileIndex]) {
          return { ...item, fileUrl: `https://ucarecdn.com/${sectionFiles[fileIndex++]}/` };
        }
        return item;
      });
    };

    const financial = await Financial.findOneAndUpdate(
      { userId: req.user.id },
      {
        BankDetails: updateDetails(BankDetails, fileUrls.slice(0, parseIfString(BankDetails).length)),
        FixedDeposits: updateDetails(FixedDeposits, fileUrls.slice(parseIfString(BankDetails).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length)),
        MutualFunds: updateDetails(MutualFunds, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length)),
        PfDetails: parseIfString(PfDetails),
        InsurancePolicies: updateDetails(InsurancePolicies, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length)),
        BusinessOwnership: updateDetails(BusinessOwnership, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length, parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length + parseIfString(BusinessOwnership).length)),
        CryptoAccounts: updateDetails(CryptoAccounts, fileUrls.slice(parseIfString(BankDetails).length + parseIfString(FixedDeposits).length + parseIfString(MutualFunds).length + parseIfString(InsurancePolicies).length + parseIfString(BusinessOwnership).length)),
      },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Financial data updated', financial });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update financial data', error: error.message });
  }
};

exports.deleteFinancial = async (req, res) => {
  try {
    await Financial.deleteOne({ userId: req.user.id });
    res.status(200).json({ message: 'Financial data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete financial data', error: error.message });
  }
};