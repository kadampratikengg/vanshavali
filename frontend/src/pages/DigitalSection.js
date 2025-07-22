import React, { useState, useEffect } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const DigitalSection = ({ setError, setSuccess, userId, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [digitalData, setDigitalData] = useState([
    {
      id: 'temp-1',
      type: 'Select Type',
      details: '',
      remark: '',
    },
  ]);
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);
  const [addedDocuments, setAddedDocuments] = useState([]);
  const [validationErrors, setValidationErrors] = useState([{ id: 'temp-1', error: '' }]);

  const digitalTypeOptions = [
    'Select Type',
    'Mobile Numbers',
    'Email Accounts',
    'Social Media',
    'Online Banking',
    'Subscriptions',
    'Cloud Storage',
    'Website Domains',
  ];

  const validateInput = (data) => {
    if (data.type === 'Select Type') {
      return 'Please select a valid digital access type';
    }
    if (!data.details) {
      return 'Details (ID/Username) are required';
    }
    return '';
  };

  useEffect(() => {
    const fetchDigitalData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/digital`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { digitalData: fetchedData } = response.data;
        console.log('Fetched digital data:', fetchedData);
        if (!fetchedData || !Array.isArray(fetchedData)) {
          console.warn('Invalid digital data structure from server:', fetchedData);
          setAddedDocuments([]);
          setShowAddedDocuments(false);
          setValidationErrors([{ id: 'temp-1', error: '' }]);
          return;
        }
        setAddedDocuments(
          fetchedData.map((item) => ({
            id: item._id,
            type: item.type,
            details: item.details,
            remark: item.remark,
          }))
        );
        setShowAddedDocuments(fetchedData.length > 0);
        setValidationErrors([{ id: 'temp-1', error: '' }]);
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Digital endpoint not found, using default data');
          setAddedDocuments([]);
          setShowAddedDocuments(false);
          setValidationErrors([{ id: 'temp-1', error: '' }]);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch digital data');
          console.error('Fetch digital data error:', error);
        }
      }
    };
    fetchDigitalData();
  }, [setError, token]);

  const handleTableChange = (id, field, value) => {
    setDigitalData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setValidationErrors((prev) =>
      prev.map((err) =>
        err.id === id ? { ...err, error: '' } : err
      )
    );
    setError('');
    setSuccess('');
  };

  const addTableRow = async (e) => {
    e.preventDefault();
    const lastRow = digitalData[digitalData.length - 1];
    const error = validateInput(lastRow);
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
      console.log('Posting to:', `${process.env.REACT_APP_API_URL}/api/digital/document`);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/digital/document`,
        {
          type: lastRow.type,
          details: lastRow.details,
          remark: lastRow.remark,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const newDocument = response.data.document;
      setAddedDocuments((prev) => [
        ...prev,
        {
          id: newDocument._id,
          type: lastRow.type,
          details: lastRow.details,
          remark: lastRow.remark,
        },
      ]);
      setShowAddedDocuments(true);
      setDigitalData([
        {
          id: `temp-${digitalData.length + 1}`,
          type: 'Select Type',
          details: '',
          remark: '',
        },
      ]);
      setValidationErrors([
        { id: `temp-${digitalData.length + 1}`, error: '' },
      ]);
      setSuccess('Digital access document added successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save digital access document');
      console.error('Add digital document error:', error);
    }
  };

  const deleteTableRow = (id) => async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/digital/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddedDocuments((prev) => prev.filter((item) => item.id !== id));
      if (addedDocuments.length <= 1) {
        setShowAddedDocuments(false);
      }
      setSuccess('Digital access document deleted successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete digital access document');
      console.error('Delete digital document error:', error);
    }
  };

  return (
    <div className="section digital-section">
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Digital Access Information
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Digital Access Table */}
        <div className="table-container mb-6">
          <h4>Digital Access Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Type</th>
                <th className="border p-2">Details (ID/Username)</th>
                <th className="border p-2">Remark</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {digitalData.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <select
                      value={item.type}
                      onChange={(e) => handleTableChange(item.id, 'type', e.target.value)}
                      className={`w-full p-1 ${validationErrors.find((err) => err.id === item.id)?.error ? 'border-red-500' : ''}`}
                    >
                      {digitalTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {validationErrors.find((err) => err.id === item.id)?.error && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.find((err) => err.id === item.id).error}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.details}
                      onChange={(e) => handleTableChange(item.id, 'details', e.target.value)}
                      className={`w-full p-1 ${validationErrors.find((err) => err.id === item.id)?.error ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.remark}
                      onChange={(e) => handleTableChange(item.id, 'remark', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={addTableRow}
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
            <h4>Added Digital Access Details</h4>
            {addedDocuments.length === 0 ? (
              <p className="text-gray-500">No digital access details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Details (ID/Username)</th>
                    <th className="border p-2">Remark</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.type !== 'Select Type' ? item.type : 'N/A'}</td>
                      <td className="border p-2">{item.details || 'N/A'}</td>
                      <td className="border p-2">{item.remark || 'N/A'}</td>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalSection;