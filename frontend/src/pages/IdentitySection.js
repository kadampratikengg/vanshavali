import React, { useState, useEffect } from 'react';
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
    { id: 1, documentType: 'Select Document', documentNumber: '', file: null },
  ]);
  const [validationErrors, setValidationErrors] = useState([{ id: 1, error: '' }]);
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);

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
    const fetchIdentityData = async () => {
      try {
        const token = localStorage.getItem('token');
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
        setIdentityData(identityData.length ? identityData : [
          { id: 1, documentType: 'Select Document', documentNumber: '', file: null },
        ]);
        setShowAddedDocuments(identityData.some(item => item.documentType !== 'Select Document' || item.documentNumber || item.fileUrl));
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch identity data');
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

  const handleIdentityFileChange = (id) => (e) => {
    const file = e.target.files[0];
    setIdentityData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file } : item))
    );
  };

  const addIdentityRow = () => {
    const lastRow = identityData[identityData.length - 1];
    if (lastRow.documentType !== 'Select Document' || lastRow.documentNumber || lastRow.file) {
      setShowAddedDocuments(true);
    }
    setIdentityData((prev) => [
      ...prev,
      { id: prev.length + 1, documentType: 'Select Document', documentNumber: '', file: null },
    ]);
    setValidationErrors((prev) => [
      ...prev,
      { id: prev.length + 1, error: '' },
    ]);
  };

  const deleteIdentityRow = (id) => {
    setIdentityData((prev) => prev.filter((item) => item.id !== id));
    setValidationErrors((prev) => prev.filter((err) => err.id !== id));
    if (
      identityData.filter(
        (item) => item.documentType !== 'Select Document' || item.documentNumber || item.file
      ).length <= 1
    ) {
      setShowAddedDocuments(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonalData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hasErrors = validationErrors.some((err) => err.error);
    if (hasErrors) {
      setError('Please correct the validation errors before submitting');
      return;
    }

    const selectedTypes = identityData.map((item) => item.documentType);
    const uniqueTypes = new Set(selectedTypes.filter((type) => type !== 'Select Document'));
    if (uniqueTypes.size < selectedTypes.filter((type) => type !== 'Select Document').length) {
      setError('Each document type can only be selected once');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('personalData', JSON.stringify(personalData));
      identityData.forEach((item, index) => {
        formData.append(`identityData[${index}]`, JSON.stringify({
          documentType: item.documentType,
          documentNumber: item.documentNumber,
        }));
        if (item.file) {
          formData.append(`file_${index}`, item.file);
        }
      });

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/identity`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Identity data saved successfully');
      handleSubmit(e);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save identity data');
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
                    <input
                      type="file"
                      onChange={handleIdentityFileChange(item.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === identityData.length - 1 ? (
                      <button
                        onClick={addIdentityRow}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteIdentityRow(item.id)}
                        className="text-red-500"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showAddedDocuments && (
          <div className="table-container mt-6">
            <h4>Added Documents</h4>
            {identityData.filter((item) => item.documentType !== 'Select Document' || item.documentNumber || item.file).length === 0 ? (
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
                  {identityData
                    .filter((item) => item.documentType !== 'Select Document' || item.documentNumber || item.file)
                    .map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="border p-2">{item.documentType !== 'Select Document' ? item.documentType : 'N/A'}</td>
                        <td className="border p-2">{item.documentNumber || 'N/A'}</td>
                        <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                        <td className="border p-2">
                          <button
                            onClick={() => deleteIdentityRow(item.id)}
                            className="text-red-500"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

export default IdentitySection;