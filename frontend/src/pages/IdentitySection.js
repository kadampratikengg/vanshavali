import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const IdentitySection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [personalData, setPersonalData] = useState({
    LegalName: '',
    AlternateName: '',
    DateOfBirth: '',
    PlaceOfBirth: '',
  });
  const [identityData, setIdentityData] = useState([
    { id: 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null },
  ]);
  const [validationErrors, setValidationErrors] = useState([{ id: 1, error: '' }]);
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);
  const [addedDocuments, setAddedDocuments] = useState([]);
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

  const documentOptions = [
    'Select Document',
    'Nationality & Domicile',
    'Aadhar',
    'Pan',
    'Passport',
    'Voter Id',
    'Driving License',
    'Marriage Cert',
    'Death Cert',
    'Name Change Docs',
    'Power Of Attorney',
    'Caste Certificate',
    'Other',
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

    identityData.forEach((item) => {
      if (!widgetRefs.current[item.id]) {
        try {
          console.log(`Initializing Uploadcare widget for ID: ${item.id}`);
          const widget = window.uploadcare.Widget(`[data-uploadcare-id="${item.id}"]`);
          widget.onUploadComplete((file) => {
            console.log(`File uploaded for ID ${item.id}:`, file);
            setIdentityData((prev) =>
              prev.map((row) => (row.id === item.id ? { ...row, file, fileUuid: file.uuid } : row))
            );
          });
          widgetRefs.current[item.id] = widget;
          console.log(`Uploadcare widget initialized for ID: ${item.id}`);
        } catch (error) {
          setError('Failed to initialize Uploadcare widget');
          console.error('Uploadcare widget error for ID:', item.id, error);
        }
      }
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
  }, [uploadcareLoaded, identityData, setError]);

  useEffect(() => {
    const fetchIdentityData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/identity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { personalData, identityData } = response.data;
        setPersonalData(personalData || {
          LegalName: '',
          AlternateName: '',
          DateOfBirth: '',
          PlaceOfBirth: '',
        });
        setAddedDocuments(identityData.map(item => ({
          id: item._id,
          documentType: item.documentType,
          documentNumber: item.documentNumber,
          fileUrl: item.fileUrl,
        })) || []);
        setShowAddedDocuments(identityData.length > 0);
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Identity endpoint not found, using default data');
          setPersonalData({
            LegalName: '',
            AlternateName: '',
            DateOfBirth: '',
            PlaceOfBirth: '',
          });
          setAddedDocuments([]);
          setShowAddedDocuments(false);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch identity data');
        }
      }
    };
    fetchIdentityData();
  }, [setError]);

  const validateInput = (documentType, value) => {
    if (documentType === 'Aadhar' && value && !/^\d{12}$/.test(value)) {
      return 'Aadhar must be a 12-digit number';
    }
    if (documentType === 'Pan' && value && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(value)) {
      return 'PAN must be in format ABCDE1234F';
    }
    if (documentType === 'Passport' && value && !/^[A-Z]{1}\d{7}$/.test(value)) {
      return 'Passport must be in format A1234567';
    }
    if (documentType === 'Voter Id' && value && !/^[A-Z]{3}\d{7}$/.test(value)) {
      return 'Voter ID must be in format ABC1234567';
    }
    if (documentType === 'Driving License' && value && !/^[A-Z]{2}\d{13}$/.test(value)) {
      return 'Driving License must be in format AB1234567890123';
    }
    return '';
  };

  const handleIdentityChange = (id, field, value) => {
    setIdentityData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    if (field === 'documentNumber') {
      const error = validateInput(
        identityData.find((item) => item.id === id).documentType,
        value
      );
      setValidationErrors((prev) =>
        prev.map((err) => (err.id === id ? { ...err, error } : err))
      );
    }
    setError('');
    setSuccess('');
  };

  const addIdentityRow = async () => {
    const lastRow = identityData[identityData.length - 1];
    if (lastRow.documentType === 'Select Document' || !lastRow.documentNumber || !lastRow.fileUuid) {
      setError('Please select a document type, enter a document number, and upload a file before adding.');
      return;
    }

    const error = validateInput(lastRow.documentType, lastRow.documentNumber);
    if (error) {
      setValidationErrors((prev) =>
        prev.map((err) => (err.id === lastRow.id ? { ...err, error } : err))
      );
      setError(error);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/identity/document`, {
        documentType: lastRow.documentType,
        documentNumber: lastRow.documentNumber,
        fileUrl: `https://ucarecdn.com/${lastRow.fileUuid}/`,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const newDocument = response.data.document;

      setAddedDocuments((prev) => [
        ...prev,
        {
          id: newDocument._id,
          documentType: newDocument.documentType,
          documentNumber: newDocument.documentNumber,
          fileUrl: newDocument.fileUrl,
        },
      ]);
      setShowAddedDocuments(true);
      setIdentityData([{ id: identityData.length + 1, documentType: 'Select Document', documentNumber: '', file: null, fileUuid: null }]);
      setValidationErrors([{ id: identityData.length + 1, error: '' }]);
      setSuccess('Document added successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save document');
      console.error('Add document error:', error);
    }
  };

  const deleteIdentityRow = (id) => async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/identity/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddedDocuments((prev) => prev.filter((item) => item.id !== id));
      if (addedDocuments.length <= 1) {
        setShowAddedDocuments(false);
      }
      setSuccess('Document deleted successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete document');
      console.error('Delete document error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonalData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleUpdateIdentity = async () => {
    setError('');
    setSuccess('');

    const hasErrors = validationErrors.some((err) => err.error);
    if (hasErrors) {
      setError('Please correct the validation errors before updating');
      return;
    }

    const selectedTypes = addedDocuments.map((item) => item.documentType);
    const uniqueTypes = new Set(selectedTypes);
    if (uniqueTypes.size < selectedTypes.length) {
      setError('Each document type can only be selected once');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/identity`, {
        identityData: addedDocuments,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setSuccess('Documents updated successfully');
      setAddedDocuments(response.data.identity.identityData.map(item => ({
        id: item._id,
        documentType: item.documentType,
        documentNumber: item.documentNumber,
        fileUrl: item.fileUrl,
      })));
      setShowAddedDocuments(response.data.identity.identityData.length > 0);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update identity data');
      console.error('Update identity error:', error);
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/identity`, {
        personalData,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setSuccess('Personal data saved successfully');
      setPersonalData(response.data.identity.personalData);
      handleSubmit(e);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save personal data');
      console.error('Update personal data error:', error);
    }
  };

  return (
    <form className="section identity-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Identity & Legal Documents
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        <div className="form-grid mb-6">
          {Object.keys(personalData).map((key) => (
            <div key={key} className="form-row">
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label htmlFor={key}>
                    {key === 'AlternateName' ? 'Alternate Name' : key.replace(/([A-Z])/g, ' $1').trim()}:
                  </label>
                  <input
                    type={key === 'DateOfBirth' ? 'date' : 'text'}
                    id={key}
                    name={key}
                    value={personalData[key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="table-container mb-6">
          <h4>Document Upload</h4>
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
              {identityData.map((item, index) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <select
                      value={item.documentType}
                      onChange={(e) => {
                        handleIdentityChange(item.id, 'documentType', e.target.value);
                        const error = validateInput(e.target.value, item.documentNumber);
                        setValidationErrors((prev) =>
                          prev.map((err) => (err.id === item.id ? { ...err, error } : err))
                        );
                      }}
                      className="w-full p-1"
                    >
                      {documentOptions.map((option) => (
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
                      onChange={(e) => handleIdentityChange(item.id, 'documentNumber', e.target.value)}
                      className={`w-full p-1 ${validationErrors.find((err) => err.id === item.id)?.error ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.find((err) => err.id === item.id)?.error && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.find((err) => err.id === item.id).error}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={item.id}
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
                      onClick={addIdentityRow}
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
        {showAddedDocuments && (
          <div className="table-container mt-6">
            <h4>Added Documents</h4>
            {addedDocuments.length === 0 ? (
              <p className="text-gray-500">No documents added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Document Type</th>
                    <th className="border p-2">Document Number</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.documentType}</td>
                      <td className="border p-2">{item.documentNumber}</td>
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
                          onClick={deleteIdentityRow(item.id)}
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
            {/* <button
              onClick={handleUpdateIdentity}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Update Documents
            </button> */}
          </div>
        )}
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Update Personal Details
        </button>
      </div>
    </form>
  );
};

export default IdentitySection;