const Financial = require('../models/Financial');

exports.createFinancial = async (req, res) => {
  try {
    const { financialData } = req.body;
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
      Banking: updateDetails(financialData.Banking, fileUrls.slice(0, parseIfString(financialData.Banking).length)),
      Investments: updateDetails(financialData.Investments, fileUrls.slice(parseIfString(financialData.Banking).length)),
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
    res.status(200).json({ financialData: financial });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch financial data', error: error.message });
  }
};

exports.updateFinancial = async (req, res) => {
  try {
    const { financialData } = req.body;
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
        Banking: updateDetails(financialData.Banking, fileUrls.slice(0, parseIfString(financialData.Banking).length)),
        Investments: updateDetails(financialData.Investments, fileUrls.slice(parseIfString(financialData.Banking).length)),
      },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Financial data updated', financialData: financial });
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

exports.addFinancialDocument = async (req, res) => {
  try {
    const { type, bankName, accountNumber, ifsc, name, detail, fileUrl } = req.body;
    const financial = await Financial.findOne({ userId: req.user.id });

    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }

    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      type,
      ...(bankName ? { bankName } : {}),
      ...(accountNumber ? { accountNumber } : {}),
      ...(ifsc ? { ifsc } : {}),
      ...(name ? { name } : {}),
      ...(detail ? { detail } : {}),
      fileUrl,
    };

    if (['Bank Account', 'Fixed Deposit', 'Recurring Deposit', 'Other Bank Related'].includes(type)) {
      financial.Banking.push(newDocument);
    } else if (['Mutual Fund', 'Business Ownership', 'Crypto Account', 'Demat Account', 'PF Account'].includes(type)) {
      financial.Investments.push(newDocument);
    }

    await financial.save();
    res.status(201).json({ message: 'Document added successfully', document: newDocument });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add document', error: error.message });
  }
};

exports.deleteFinancialDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const financial = await Financial.findOne({ userId: req.user.id });

    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }

    financial.Banking = financial.Banking.filter((item) => item._id.toString() !== id);
    financial.Investments = financial.Investments.filter((item) => item._id.toString() !== id);

    await financial.save();
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};