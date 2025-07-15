const { UploadClient } = require('@uploadcare/upload-client');
const uploadcare = new UploadClient({
  publicKey: process.env.UPLOADCARE_PUBLIC_KEY,
});

const uploadcareMiddleware = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  const uploadFile = async (file) => {
    try {
      const result = await uploadcare.upload(file.buffer);
      return result.uuid;
    } catch (error) {
      throw new Error(`Uploadcare upload failed: ${error.message}`);
    }
  };

  try {
    const uploadPromises = req.files
      ? Object.values(req.files).flat().map((file) => uploadFile(file))
      : [uploadFile(req.file)];

    const uuids = await Promise.all(uploadPromises);
    req.uploadcareUuids = uuids;
    next();
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

module.exports = uploadcareMiddleware;