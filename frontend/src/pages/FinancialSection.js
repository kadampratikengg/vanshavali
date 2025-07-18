import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const FinancialSection = ({ setError, setSuccess, userId, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [financialData, setFinancialData] = useState({
    Banking: [{ id: 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null }],
    Investments: [{ id: 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null }],
  });
  const [validationErrors, setValidationErrors] = useState({
    Banking: [{ id: 1, error: '' }],
    Investments: [{ id: 1, error: '' }],
  });
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

  const documentOptions = {
    Banking: ['Select Document', 'Bank Statement', 'Passbook', 'Fixed Deposit Certificate', 'Other'],
    Investments: ['Select Document', 'Mutual Fund Statement', 'Demat Account Statement', 'PF Statement', 'Other'],
  };

  const validateInput = (section, documentType, documentNumber) => {
    if (documentType === 'Select Document') {
      return 'Please select a valid document type';
    }
    if (!documentNumber) {
      return 'Document number is required';
    }
    if (section === 'Banking' && documentNumber) {
      if (!/^\d{9,18}$/.test(documentNumber)) {
        return 'Bank Account Number must be 9-18 digits';
      }
    }
    if (section === 'Investments' && documentNumber) {
      if (!/^[A-Za-z0-9/-]{1,50}$/.test(documentNumber)) {
        return 'Investment Document Number must be alphanumeric with optional slashes or hyphens (max 50 characters)';
      }
    }
    return '';
  };

  useEffect(() => {
    console.log('Uploadcare Public Key:', process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY);
    console.log('API URL:', process.env.REACT_APP_API_URL);
  }, []);

  useEffect(() => {
    const loadUploadcare = async () => {
      try {
        console.log('Attempting to load Uploadcare script...');
        if (!window.uploadcare) {
          await import('https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js');
          window.UPLOADCARE_PUBLIC_KEY = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;
          console.log('Uploadcare script loaded successfully');
        }
        setUploadcareLoaded(true);
      } catch (error) {
        console.error('Uploadcare load error:', error);
        setError('Failed to load Uploadcare widget. Please try again later.');
        setTimeout(loadUploadcare, 5000);
      }
    };
    loadUploadcare();
  }, [setError]);

  useEffect(() => {
    if (!uploadcareLoaded || !window.uploadcare) {
      console.log('Uploadcare not loaded or window.uploadcare not available');
      return;
    }

    Object.keys(financialData).forEach((section) => {
      financialData[section].forEach((item) => {
        if (!widgetRefs.current[`${section}_${item.id}`]) {
          try {
            console.log(`Initializing Uploadcare widget for ${section} ID: ${item.id}`);
            const widget = window.uploadcare.Widget(`[data-uploadcare-id="${section}_${item.id}"]`);
            widget.onUploadComplete((file) => {
              console.log(`File uploaded for ${section} ID ${item.id}:`, file);
              setFinancialData((prev) => ({
                ...prev,
                [section]: prev[section].map((row) =>
                  row.id === item.id ? { ...row, file, fileUuid: file.uuid } : row
                ),
              }));
            });
            widgetRefs.current[`${section}_${item.id}`] = widget;
            console.log(`Uploadcare widget initialized for ${section} ID: ${item.id}`);
          } catch (error) {
            setError('Failed to initialize Uploadcare widget');
            console.error(`Uploadcare widget error for ${section} ID:`, item.id, error);
          }
        }
      });
    });

    return () => {
      Object.values(widgetRefs.current).forEach((widget) => {
        try {
          console.log('Cleaning up Uploadcare widget');
        } catch (error) {
          console.error('Error cleaning up Uploadcare widget:', error);
        }
      });
      widgetRefs.current = {};
    };
  }, [uploadcareLoaded, financialData, setError]);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          console.log('Token missing');
          return;
        }
        console.log('Fetching financial data with token:', token);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/financial`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Backend response:', response.data);
        const { financialData: fetchedData } = response.data;
        const newFinancialData = {
          Banking: [
            ...(fetchedData?.Banking?.map(item => ({
              id: item._id,
              documentType: item.type || 'Select Document',
              documentNumber: item.accountNumber || '',
              file: null,
              fileUuid: item.fileUrl ? item.fileUrl.replace('https://ucarecdn.com/', '').replace('/', '') : null,
            })) || []),
            { id: Math.max(...(fetchedData?.Banking?.map(item => item._id) || [0])) + 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null },
          ],
          Investments: [
            ...(fetchedData?.Investments?.map(item => ({
              id: item._id,
              documentType: item.type || 'Select Document',
              documentNumber: item.name || item.detail || '',
              file: null,
              fileUuid: item.fileUrl ? item.fileUrl.replace('https://ucarecdn.com/', '').replace('/', '') : null,
            })) || []),
            { id: Math.max(...(fetchedData?.Investments?.map(item => item._id) || [0])) + 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null },
          ],
        };
        setFinancialData(newFinancialData);
        console.log('Transformed financialData:', newFinancialData);
        setValidationErrors({
          Banking: newFinancialData.Banking.map(item => ({ id: item.id, error: '' })),
          Investments: newFinancialData.Investments.map(item => ({ id: item.id, error: '' })),
        });
        console.log('validationErrors:', {
          Banking: newFinancialData.Banking.map(item => ({ id: item.id, error: '' })),
          Investments: newFinancialData.Investments.map(item => ({ id: item.id, error: '' })),
        });
        setExpanded(true);
      } catch (error) {
        console.error('Fetch error:', error);
        if (error.response?.status === 404) {
          console.warn('Financial endpoint not found, using default data');
          const defaultData = {
            Banking: [{ id: 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null }],
            Investments: [{ id: 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null }],
          };
          setFinancialData(defaultData);
          setValidationErrors({
            Banking: [{ id: 1, error: '' }],
            Investments: [{ id: 1, error: '' }],
          });
          setExpanded(true);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch financial data');
        }
      }
    };
    fetchFinancialData();
  }, [setError, token]);

  const handleFinancialTableChange = (section, id, field, value) => {
    setFinancialData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    if (field === 'documentNumber' || field === 'documentType') {
      const updatedRow = financialData[section].find((item) => item.id === id);
      const error = validateInput(section, field === 'documentType' ? value : updatedRow.documentType, updatedRow.documentNumber);
      setValidationErrors((prev) => ({
        ...prev,
        [section]: prev[section].map((err) =>
          err.id === id ? { ...err, error } : err
        ),
      }));
    }
    setError('');
    setSuccess('');
  };

  const addFinancialRow = (section) => async () => {
    const lastRow = financialData[section][financialData[section].length - 1];
    if (lastRow.documentType === 'Select Document' || !lastRow.documentNumber || !lastRow.fileUuid) {
      setError(`Please select a document type, enter a document number, and upload a file for ${section} before adding.`);
      return;
    }

    const error = validateInput(section, lastRow.documentType, lastRow.documentNumber);
    if (error) {
      setValidationErrors((prev) => ({
        ...prev,
        [section]: prev[section].map((err) =>
          err.id === lastRow.id ? { ...err, error } : err
        ),
      }));
      setError(error);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/financial/document`,
        {
          type: lastRow.documentType,
          ...(section === 'Banking' ? { accountNumber: lastRow.documentNumber } : { name: lastRow.documentNumber }),
          fileUrl: `https://ucarecdn.com/${lastRow.fileUuid}/`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('POST response:', response.data);

      const newDocument = response.data.document;
      setFinancialData((prev) => {
        const newData = {
          ...prev,
          [section]: [
            ...prev[section].filter(row => row.id !== lastRow.id),
            {
              id: newDocument._id,
              documentType: newDocument.type,
              documentNumber: section === 'Banking' ? newDocument.accountNumber : newDocument.name,
              file: null,
              fileUuid: newDocument.fileUrl ? newDocument.fileUrl.replace('https://ucarecdn.com/', '').replace('/', '') : null,
            },
            { id: Math.max(...prev[section].map(row => row.id)) + 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null },
          ],
        };
        console.log('Updated financialData:', newData);
        return newData;
      });
      setValidationErrors((prev) => ({
        ...prev,
        [section]: [
          ...prev[section].filter(err => err.id !== lastRow.id),
          { id: Math.max(...prev[section].map(row => row.id)) + 1, error: '' },
        ],
      }));
      setSuccess(`${section} document added successfully`);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to save ${section.toLowerCase()} document`);
      console.error(`Add ${section} document error:`, error);
    }
  };

  const deleteFinancialRow = (section, id) => async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/financial/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFinancialData((prev) => ({
        ...prev,
        [section]: prev[section].filter((item) => item.id !== id),
      }));
      if (financialData[section].length <= 1) {
        setFinancialData((prev) => ({
          ...prev,
          [section]: [{ id: 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null }],
        }));
        setValidationErrors((prev) => ({
          ...prev,
          [section]: [{ id: 1, error: '' }],
        }));
      }
      setSuccess(`${section} document deleted successfully`);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to delete ${section.toLowerCase()} document`);
      console.error(`Delete ${section} document error:`, error);
    }
  };

  const renderTable = (section, title) => (
    <div className="table-container mb-6">
      <h4>{title}</h4>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Document Type</th>
            <th className="border p-2">Document Number</th>
            <th className="border p-2">Upload File</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {financialData[section].map((item, index) => (
            <tr key={item.id} className="table-row">
              <td className="border p-2">
                <select
                  value={item.documentType}
                  onChange={(e) => handleFinancialTableChange(section, item.id, 'documentType', e.target.value)}
                  className="w-full p-1"
                  disabled={item.fileUuid}
                >
                  {documentOptions[section].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td className="border p-2">
                <input
                  type="text"
                  value={item.documentNumber}
                  onChange={(e) => handleFinancialTableChange(section, item.id, 'documentNumber', e.target.value)}
                  className={`w-full p-1 ${validationErrors[section].find((err) => err.id === item.id)?.error ? 'border-red-500' : ''}`}
                  disabled={item.fileUuid}
                />
                {validationErrors[section].find((err) => err.id === item.id)?.error && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors[section].find((err) => err.id === item.id).error}
                  </p>
                )}
              </td>
              <td className="border p-2">
                {uploadcareLoaded ? (
                  <div>
                    {item.fileUuid ? (
                      <a href={`https://ucarecdn.com/${item.fileUuid}/`} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                        View File
                      </a>
                    ) : (
                      <input
                        type="hidden"
                        data-uploadcare-id={`${section}_${item.id}`}
                        data-public-key={process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY}
                        data-images-only="false"
                        data-max-size="104857600"
                        data-file-types=".pdf,.jpg,.png"
                        className="w-full"
                      />
                    )}
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </div>
                ) : (
                  <p className="text-gray-500">Loading uploader...</p>
                )}
              </td>
              <td className="border p-2">
                {item.fileUuid ? (
                  <button
                    onClick={deleteFinancialRow(section, item.id)}
                    className="text-red-500"
                  >
                    <FaTimes />
                  </button>
                ) : (
                  index === financialData[section].length - 1 && (
                    <button
                      onClick={addFinancialRow(section)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Add
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="section financial-section">
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Financial Records
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {renderTable('Banking', 'Banking')}
        {renderTable('Investments', 'Investments')}
      </div>
    </div>
  );
};

export default FinancialSection;