const Financial = require('../models/Financial');

exports.createFinancial = async (req, res) => {
  try {
    const { type, bankName, accountNumber, ifsc, name, detail, fileUrl } = req.body;
    if (!type || type === 'Select Type' || !fileUrl) {
      return res.status(400).json({ message: 'Type and file URL are required' });
    }
    let financial = await Financial.findOne({ userId: req.user.id });
    if (!financial) {
      financial = new Financial({
        userId: req.user.id,
        financialData: { Banking: [], Investments: [] },
      });
    }
    const section = bankName ? 'Banking' : 'Investments';
    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      type,
      ...(section === 'Banking' ? { bankName, accountNumber, ifsc } : { name, detail }),
      fileUrl,
    };
    financial.financialData[section].push(newDocument);
    await financial.save();
    res.status(201).json({ message: 'Document added', document: newDocument });
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
    const { financialData } = req.body;
    const parsedFinancialData = typeof financialData === 'string' ? JSON.parse(financialData) : financialData;
    const fileUrls = req.uploadcareUuids || [];

    const updatedFinancialData = {
      Banking: parsedFinancialData.Banking.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : item.fileUrl,
      })),
      Investments: parsedFinancialData.Investments.map((item, index) => ({
        ...item,
        fileUrl: fileUrls[index] ? `https://ucarecdn.com/${fileUrls[index]}/` : item.fileUrl,
      })),
    };

    const financial = await Financial.findOneAndUpdate(
      { userId: req.user.id },
      { financialData: updatedFinancialData },
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