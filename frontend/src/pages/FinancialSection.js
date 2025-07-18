import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const FinancialSection = ({ setError, setSuccess, userId, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [financialData, setFinancialData] = useState({
    Banking: [{ id: 1, type: 'Select Type', bankName: '', accountNumber: '', ifsc: '', fileUuid: null }],
    Investments: [{ id: 1, type: 'Select Type', name: '', detail: '', fileUuid: null }],
  });
  const [showAddedDocuments, setShowAddedDocuments] = useState({
    banking: false,
    investments: false,
  });
  const [addedDocuments, setAddedDocuments] = useState({
    Banking: [],
    Investments: [],
  });
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

  const bankingOptions = [
    'Select Type',
    'Bank Account',
    'Fixed Deposit',
    'Recurring Deposit',
    'Other Bank Related',
  ];

  const investmentOptions = [
    'Select Type',
    'Mutual Fund',
    'Business Ownership',
    'Crypto Account',
    'Demat Account',
    'PF Account',
  ];

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
        setError('Failed to load Uploadcare widget');
        console.error('Uploadcare load error:', error);
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
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/financial`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { financialData: fetchedData } = response.data;
        setFinancialData(fetchedData || {
          Banking: [{ id: 1, type: 'Select Type', bankName: '', accountNumber: '', ifsc: '', fileUuid: null }],
          Investments: [{ id: 1, type: 'Select Type', name: '', detail: '', fileUuid: null }],
        });
        setAddedDocuments({
          Banking: fetchedData?.Banking?.map(item => ({
            id: item._id,
            type: item.type,
            bankName: item.bankName,
            accountNumber: item.accountNumber,
            ifsc: item.ifsc,
            fileUrl: item.fileUrl,
          })) || [],
          Investments: fetchedData?.Investments?.map(item => ({
            id: item._id,
            type: item.type,
            name: item.name,
            detail: item.detail,
            fileUrl: item.fileUrl,
          })) || [],
        });
        setShowAddedDocuments({
          banking: fetchedData?.Banking?.length > 0,
          investments: fetchedData?.Investments?.length > 0,
        });
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Financial endpoint not found, using default data');
          setFinancialData({
            Banking: [{ id: 1, type: 'Select Type', bankName: '', accountNumber: '', ifsc: '', fileUuid: null }],
            Investments: [{ id: 1, type: 'Select Type', name: '', detail: '', fileUuid: null }],
          });
          setAddedDocuments({
            Banking: [],
            Investments: [],
          });
          setShowAddedDocuments({
            banking: false,
            investments: false,
          });
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
    setError('');
    setSuccess('');
  };

  const addFinancialRow = (section) => async () => {
    const lastRow = financialData[section][financialData[section].length - 1];
    if (lastRow.type === 'Select Type' || (!lastRow.bankName && !lastRow.accountNumber && !lastRow.ifsc && !lastRow.name && !lastRow.detail) || !lastRow.fileUuid) {
      setError(`Please select a type, fill at least one field, and upload a file for ${section} before adding.`);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/financial/${section.toLowerCase()}`,
        {
          ...lastRow,
          fileUrl: lastRow.fileUuid ? `https://ucarecdn.com/${lastRow.fileUuid}/` : '',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const newDocument = response.data.document;
      setAddedDocuments((prev) => ({
        ...prev,
        [section]: [
          ...prev[section],
          {
            id: newDocument._id,
            type: lastRow.type,
            ...(section === 'Banking' ? {
              bankName: lastRow.bankName,
              accountNumber: lastRow.accountNumber,
              ifsc: lastRow.ifsc,
            } : {
              name: lastRow.name,
              detail: lastRow.detail,
            }),
            fileUrl: newDocument.fileUrl,
          },
        ],
      }));
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: true }));
      setFinancialData((prev) => ({
        ...prev,
        [section]: [
          ...prev[section],
          {
            id: prev[section].length + 1,
            type: 'Select Type',
            ...(section === 'Banking' ? { bankName: '', accountNumber: '', ifsc: '', fileUuid: null } :
              section === 'Investments' ? { name: '', detail: '', fileUuid: null } : {})
          },
        ],
      }));
      setSuccess(`${section} added successfully`);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to save ${section.toLowerCase()}`);
      console.error(`Add ${section} error:`, error);
    }
  };

  const deleteFinancialRow = (section, id) => async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/financial/${section.toLowerCase()}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddedDocuments((prev) => ({
        ...prev,
        [section]: prev[section].filter((item) => item.id !== id),
      }));
      if (addedDocuments[section].length <= 1) {
        setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: false }));
      }
      setSuccess(`${section} deleted successfully`);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to delete ${section.toLowerCase()}`);
      console.error(`Delete ${section} error:`, error);
    }
  };

  const handleUpdateFinancial = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/financial`,
        { financialData: addedDocuments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess('Financial data updated successfully');
      setAddedDocuments({
        Banking: response.data.financialData.Banking?.map(item => ({
          id: item._id,
          type: item.type,
          bankName: item.bankName,
          accountNumber: item.accountNumber,
          ifsc: item.ifsc,
          fileUrl: item.fileUrl,
        })) || [],
        Investments: response.data.financialData.Investments?.map(item => ({
          id: item._id,
          type: item.type,
          name: item.name,
          detail: item.detail,
          fileUrl: item.fileUrl,
        })) || [],
      });
      setShowAddedDocuments({
        banking: response.data.financialData.Banking?.length > 0,
        investments: response.data.financialData.Investments?.length > 0,
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update financial data');
      console.error('Update financial error:', error);
    }
  };

  return (
    <form className="section financial-section">
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Financial Records
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Banking */}
        <div className="table-container mb-6">
          <h4>Banking</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Type</th>
                <th className="border p-2">Bank Name</th>
                <th className="border p-2">Account Number</th>
                <th className="border p-2">IFSC</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.Banking.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <select
                      value={item.type}
                      onChange={(e) => handleFinancialTableChange('Banking', item.id, 'type', e.target.value)}
                      className="w-full p-1"
                    >
                      {bankingOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.bankName}
                      onChange={(e) => handleFinancialTableChange('Banking', item.id, 'bankName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.accountNumber}
                      onChange={(e) => handleFinancialTableChange('Banking', item.id, 'accountNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.ifsc}
                      onChange={(e) => handleFinancialTableChange('Banking', item.id, 'ifsc', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`Banking_${item.id}`}
                          data-public-key={process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY}
                          data-images-only="false"
                          data-max-size="104857600"
                          data-file-types=".pdf,.jpg,.png"
                          className="w-full"
                        />
                        {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                      </div>
                    ) : (
                      <p className="text-gray-500">Loading uploader...</p>
                    )}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={addFinancialRow('Banking')}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showAddedDocuments.banking && (
          <div className="table-container mt-6">
            <h4>Added Banking Details</h4>
            {addedDocuments.Banking.length === 0 ? (
              <p className="text-gray-500">No banking details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Bank Name</th>
                    <th className="border p-2">Account Number</th>
                    <th className="border p-2">IFSC</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.Banking.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.type}</td>
                      <td className="border p-2">{item.bankName || 'N/A'}</td>
                      <td className="border p-2">{item.accountNumber || 'N/A'}</td>
                      <td className="border p-2">{item.ifsc || 'N/A'}</td>
                      <td className="border p-2">
                        {item.fileUrl ? (
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                            View File
                          </a>
                        ) : (
                          'No file uploaded'
                        )}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={deleteFinancialRow('Banking', item.id)}
                          className="text-red-500"
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Investments */}
        <div className="table-container mb-6">
          <h4>Investments</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Type</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Detail</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.Investments.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <select
                      value={item.type}
                      onChange={(e) => handleFinancialTableChange('Investments', item.id, 'type', e.target.value)}
                      className="w-full p-1"
                    >
                      {investmentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleFinancialTableChange('Investments', item.id, 'name', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.detail}
                      onChange={(e) => handleFinancialTableChange('Investments', item.id, 'detail', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`Investments_${item.id}`}
                          data-public-key={process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY}
                          data-images-only="false"
                          data-max-size="104857600"
                          data-file-types=".pdf,.jpg,.png"
                          className="w-full"
                        />
                        {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                      </div>
                    ) : (
                      <p className="text-gray-500">Loading uploader...</p>
                    )}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={addFinancialRow('Investments')}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showAddedDocuments.investments && (
          <div className="table-container mt-6">
            <h4>Added Investments</h4>
            {addedDocuments.Investments.length === 0 ? (
              <p className="text-gray-500">No investments added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Detail</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.Investments.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.type}</td>
                      <td className="border p-2">{item.name || 'N/A'}</td>
                      <td className="border p-2">{item.detail || 'N/A'}</td>
                      <td className="border p-2">
                        {item.fileUrl ? (
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                            View File
                          </a>
                        ) : (
                          'No file uploaded'
                        )}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={deleteFinancialRow('Investments', item.id)}
                          className="text-red-500"
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <button
          onClick={handleUpdateFinancial}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Update Financial Details
        </button>
      </div>
    </form>
  );
};

export default FinancialSection;