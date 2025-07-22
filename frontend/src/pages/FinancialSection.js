import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const FinancialSection = ({ setError, setSuccess, userId, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [financialData, setFinancialData] = useState([{
    id: 1,
    section: 'Banking',
    documentType: 'Select Document',
    documentNumber: '',
    remark: '',
    file: null,
    fileUuid: null,
  }]);
  const [addedDocuments, setAddedDocuments] = useState([]);
  const [validationErrors, setValidationErrors] = useState([{ id: 1, error: '' }]);
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

  const documentOptions = {
    Banking: ['Select Document', 'Bank Details', 'Passbook', 'Fixed Deposit Details', 'Other'],
    Investments: ['Select Document', 'Mutual Fund Details', 'Demat Account Details', 'PF Details', 'Other'],
  };

  const allDocumentTypes = [
    ...new Set(Object.values(documentOptions).flat()),
  ].sort((a, b) => {
    if (a === 'Select Document') return -1;
    if (b === 'Select Document') return 1;
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

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

    const initializeWidgets = () => {
      financialData.forEach((item) => {
        if (!widgetRefs.current[`${item.section}_${item.id}`]) {
          const selector = `[data-uploadcare-id="${item.section}_${item.id}"]`;
          const element = document.querySelector(selector);
          if (!element) {
            console.warn(`No DOM element found for selector ${selector}. Retrying...`);
            return;
          }
          try {
            console.log(`Initializing Uploadcare widget for ${item.section} ID: ${item.id}`);
            const widget = window.uploadcare.Widget(selector);
            widget.onUploadComplete((file) => {
              console.log(`File uploaded for ${item.section} ID ${item.id}:`, file);
              setFinancialData((prev) =>
                prev.map((row) =>
                  row.id === item.id ? { ...row, file, fileUuid: file.uuid } : row
                )
              );
            });
            widgetRefs.current[`${item.section}_${item.id}`] = widget;
            console.log(`Uploadcare widget initialized for ${item.section} ID: ${item.id}`);
          } catch (error) {
            console.error(`Uploadcare widget error for ${item.section} ID: ${item.id}`, error);
            setError('Failed to initialize Uploadcare widget');
          }
        }
      });
    };

    const timer = setTimeout(() => {
      initializeWidgets();
    }, 100);

    return () => {
      clearTimeout(timer);
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
        console.log('Backend response (raw):', JSON.stringify(response.data, null, 2));
        const { financialData: fetchedData } = response.data;

        if (!fetchedData || typeof fetchedData !== 'object') {
          console.warn('Invalid or missing financialData in response:', fetchedData);
          setError('Invalid data received from server');
          return;
        }

        const newFinancialData = [{
          id: 1,
          section: 'Banking',
          documentType: 'Select Document',
          documentNumber: '',
          remark: '',
          file: null,
          fileUuid: null,
        }];
        const newAddedDocuments = [
          ...(Array.isArray(fetchedData.Banking)
            ? fetchedData.Banking.map(item => ({
                id: item._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
                section: 'Banking',
                documentType: item.type || 'Select Document',
                documentNumber: item.accountNumber || item.number || '',
                remark: item.remark || '',
                fileUrl: item.fileUrl || null,
              }))
            : []),
          ...(Array.isArray(fetchedData.Investments)
            ? fetchedData.Investments.map(item => ({
                id: item._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
                section: 'Investments',
                documentType: item.type || 'Select Document',
                documentNumber: item.name || item.number || '',
                remark: item.remark || '',
                fileUrl: item.fileUrl || null,
              }))
            : []),
        ];
        setFinancialData(newFinancialData);
        setAddedDocuments(newAddedDocuments);
        console.log('Transformed financialData:', JSON.stringify(newFinancialData, null, 2));
        console.log('Transformed addedDocuments:', JSON.stringify(newAddedDocuments, null, 2));
        console.log('Checking documentNumber and remark in addedDocuments:', 
          newAddedDocuments.map(doc => ({
            id: doc.id,
            documentNumber: doc.documentNumber,
            remark: doc.remark,
          }))
        );
        setValidationErrors(newFinancialData.map(item => ({ id: item.id, error: '' })));
        console.log('validationErrors:', JSON.stringify(
          newFinancialData.map(item => ({ id: item.id, error: '' })),
          null,
          2
        ));
        // setExpanded(true);
      } catch (error) {
        console.error('Fetch error:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          } : 'No response received',
        });
        if (error.response?.status === 404) {
          console.warn('Financial endpoint not found, using default data');
          const defaultData = [{
            id: 1,
            section: 'Banking',
            documentType: 'Select Document',
            documentNumber: '',
            remark: '',
            file: null,
            fileUuid: null,
          }];
          setFinancialData(defaultData);
          setAddedDocuments([]);
          setValidationErrors([{ id: 1, error: '' }]);
          // setExpanded(true);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch financial data');
        }
      }
    };
    fetchFinancialData();
  }, [setError, token]);

  const handleTableChange = (id, field, value) => {
    setFinancialData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    if (field === 'documentNumber' || field === 'documentType' || field === 'section') {
      const updatedRow = financialData.find((item) => item.id === id);
      const error = validateInput(
        field === 'section' ? value : updatedRow.section,
        field === 'documentType' ? value : updatedRow.documentType,
        field === 'documentNumber' ? value : updatedRow.documentNumber
      );
      setValidationErrors((prev) =>
        prev.map((err) =>
          err.id === id ? { ...err, error } : err
        )
      );
    }
    setError('');
    setSuccess('');
  };

  const addTableRow = async () => {
    const lastRow = financialData[financialData.length - 1];
    if (lastRow.documentType === 'Select Document' || !lastRow.documentNumber || !lastRow.fileUuid) {
      setError('Please select a document type, enter a document number, and upload a file before adding.');
      return;
    }

    const error = validateInput(lastRow.section, lastRow.documentType, lastRow.documentNumber);
    if (error) {
      setValidationErrors((prev) =>
        prev.map((err) =>
          err.id === lastRow.id ? { ...err, error } : err
        )
      );
      setError(error);
      return;
    }

    try {
      console.log('Sending POST request to /financial/document with payload:', {
        type: lastRow.documentType,
        number: lastRow.documentNumber,
        remark: lastRow.remark || '',
        fileUrl: `https://ucarecdn.com/${lastRow.fileUuid}/`,
        section: lastRow.section,
      });
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/financial/document`,
        {
          type: lastRow.documentType,
          number: lastRow.documentNumber,
          remark: lastRow.remark || '',
          fileUrl: `https://ucarecdn.com/${lastRow.fileUuid}/`,
          section: lastRow.section,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('POST response:', JSON.stringify(response.data, null, 2));

      const newDocument = response.data.document;
      if (!newDocument.number) {
        console.warn(`Missing 'number' in POST response:`, newDocument);
      }
      setAddedDocuments((prev) => [
        ...prev,
        {
          id: newDocument._id,
          section: newDocument.section || lastRow.section,
          documentType: newDocument.type || 'Select Document',
          documentNumber: newDocument.number || lastRow.documentNumber,
          remark: newDocument.remark || lastRow.remark,
          fileUrl: newDocument.fileUrl || `https://ucarecdn.com/${lastRow.fileUuid}/`,
        },
      ]);
      setFinancialData((prev) => [
        {
          id: Math.max(...prev.map(row => Number(row.id)), 0) + 1,
          section: 'Banking',
          documentType: 'Select Document',
          documentNumber: '',
          remark: '',
          file: null,
          fileUuid: null,
        },
      ]);
      setValidationErrors((prev) => [
        { id: Math.max(...prev.map(err => Number(err.id)), 0) + 1, error: '' },
      ]);
      setSuccess('Document added successfully');
    } catch (error) {
      console.error('Add document error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        } : 'No response received',
      });
      setError(error.response?.data?.message || 'Failed to save document. Please check the console for details.');
    }
  };

  const deleteTableRow = (id) => async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/financial/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddedDocuments((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Document deleted successfully');
    } catch (error) {
      console.error('Delete document error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        } : 'No response received',
      });
      setError(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const renderTable = () => (
    <div className="table-container mb-6">
      <h4>Financial Records</h4>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Document Type</th>
            <th className="border p-2">Document Number</th>
            <th className="border p-2">Remark (Optional)</th>
            <th className="border p-2">Upload File</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {financialData.map((item, index) => (
            <tr key={item.id} className="table-row">
              <td className="border p-2">
                <select
                  value={item.documentType}
                  onChange={(e) => {
                    handleTableChange(item.id, 'documentType', e.target.value);
                    const error = validateInput(item.section, e.target.value, item.documentNumber);
                    setValidationErrors((prev) =>
                      prev.map((err) =>
                        err.id === item.id ? { ...err, error } : err
                      )
                    );
                  }}
                  className="w-full p-1"
                  disabled={item.fileUuid}
                >
                  {allDocumentTypes.map((option) => (
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
                  onChange={(e) => handleTableChange(item.id, 'documentNumber', e.target.value)}
                  className={`w-full p-1 ${validationErrors.find((err) => err.id === item.id)?.error ? 'border-red-500' : ''}`}
                  disabled={item.fileUuid}
                />
                {validationErrors.find((err) => err.id === item.id)?.error && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.find((err) => err.id === item.id).error}
                  </p>
                )}
              </td>
              <td className="border p-2">
                <input
                  type="text"
                  value={item.remark}
                  onChange={(e) => handleTableChange(item.id, 'remark', e.target.value)}
                  className="w-full p-1"
                  disabled={item.fileUuid}
                />
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
                        data-uploadcare-id={`${item.section}_${item.id}`}
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
                {index === financialData.length - 1 && (
                  <button
                    onClick={addTableRow}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    Add
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {addedDocuments.length > 0 && (
        <div className="table-container mt-6">
          <h4>Added Documents</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Document Type</th>
                <th className="border p-2">Document Number</th>
                <th className="border p-2">Remark</th>
                <th className="border p-2">View File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {addedDocuments.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">{item.documentType}</td>
                  <td className="border p-2">{item.documentNumber || 'N/A'}</td>
                  <td className="border p-2">{item.remark || 'N/A'}</td>
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
                      onClick={deleteTableRow(item.id)}
                      className="text-red-500"
                    >
                      <FaTimes />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="section financial-section">
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Financial Records
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {renderTable()}
      </div>
    </div>
  );
};

export default FinancialSection;