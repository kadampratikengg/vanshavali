import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const LegacySection = ({ setError, setSuccess, userId, token }) => {
 
  const [legacyData, setLegacyData] = useState([
    {
      id: 'temp-1',
      type: 'Select Type',
      message: '',
      file: null,
      fileUuid: null,
    },
  ]);
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);
  const [addedDocuments, setAddedDocuments] = useState([]);
  const [validationErrors, setValidationErrors] = useState([{ id: 'temp-1', error: '' }]);
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

  const typeOptions = [
    'Select Type',
    'Family Photo',
    'Voice Messages',
    'Video Message',
  ];

  const validateInput = (data) => {
    if (data.type === 'Select Type') {
      return 'Please select a valid type';
    }
    if (!data.message && !data.fileUuid) {
      return 'Please provide a message or upload a file';
    }
    return '';
  };

  useEffect(() => {
    const loadUploadcare = async () => {
      try {
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
      return;
    }

    legacyData.forEach((item) => {
      if (!widgetRefs.current[item.id]) {
        try {
          const widget = window.uploadcare.Widget(`[data-uploadcare-id="Legacy_${item.id}"]`);
          widget.onUploadComplete((file) => {
            setLegacyData((prev) =>
              prev.map((row) =>
                row.id === item.id ? { ...row, file, fileUuid: file.uuid } : row
              )
            );
          });
          widgetRefs.current[item.id] = widget;
        } catch (error) {
          setError('Failed to initialize Uploadcare widget');
          console.error(`Uploadcare widget error for ID: ${item.id}`, error);
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
  }, [uploadcareLoaded, legacyData, setError]);

  useEffect(() => {
    const fetchLegacyData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          return;
        }
        console.log('API Base URL:', process.env.REACT_APP_API_URL);
        console.log('Fetching legacy data from:', `${process.env.REACT_APP_API_URL}/api/legacy`);
        console.log('Token:', token);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/legacy`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { legacyData: fetchedData } = response.data;
        console.log('Fetched legacy data:', fetchedData);
        if (!fetchedData || !Array.isArray(fetchedData)) {
          console.warn('Invalid legacy data structure from server:', fetchedData);
          setAddedDocuments([]);
          setShowAddedDocuments(false);
          setValidationErrors([{ id: 'temp-1', error: '' }]);
          return;
        }
        setAddedDocuments(
          fetchedData.map((item) => ({
            id: item._id,
            type: item.type || 'N/A',
            message: item.message || '',
            fileUrl: item.fileUrl || null,
          }))
        );
        setShowAddedDocuments(fetchedData.length > 0);
        setValidationErrors([{ id: 'temp-1', error: '' }]);
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Legacy endpoint not found, using default data');
          setAddedDocuments([]);
          setShowAddedDocuments(false);
          setValidationErrors([{ id: 'temp-1', error: '' }]);
          setError('Legacy data endpoint not found. Please check the server configuration.');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch legacy data');
          console.error('Fetch legacy data error:', error);
        }
      }
    };
    fetchLegacyData();
  }, [setError, token]);

  const handleTableChange = (id, field, value) => {
    setLegacyData((prev) =>
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
    const lastRow = legacyData[legacyData.length - 1];
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
      console.log('API Base URL:', process.env.REACT_APP_API_URL);
      console.log('Posting to:', `${process.env.REACT_APP_API_URL}/api/legacy/document`);
      console.log('Payload:', {
        type: lastRow.type,
        message: lastRow.message,
        fileUrl: lastRow.fileUuid ? `https://ucarecdn.com/${lastRow.fileUuid}/` : '',
      });
      console.log('Token:', token);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/legacy/document`,
        {
          type: lastRow.type,
          message: lastRow.message,
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
      setAddedDocuments((prev) => [
        ...prev,
        {
          id: newDocument._id,
          type: lastRow.type,
          message: lastRow.message,
          fileUrl: newDocument.fileUrl,
        },
      ]);
      setShowAddedDocuments(true);
      setLegacyData([
        {
          id: `temp-${legacyData.length + 1}`,
          type: 'Select Type',
          message: '',
          file: null,
          fileUuid: null,
        },
      ]);
      setValidationErrors([{ id: `temp-${legacyData.length + 1}`, error: '' }]);
      setSuccess('Legacy document added successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Legacy document endpoint not found. Please check the server configuration or contact support.');
      } else {
        setError(error.response?.data?.message || 'Failed to save legacy document');
      }
      console.error('Add legacy document error:', error);
    }
  };

  const deleteTableRow = (id) => async () => {
    try {
      console.log('API Base URL:', process.env.REACT_APP_API_URL);
      console.log('Deleting document at:', `${process.env.REACT_APP_API_URL}/api/legacy/document/${id}`);
      console.log('Token:', token);
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/legacy/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddedDocuments((prev) => prev.filter((item) => item.id !== id));
      if (addedDocuments.length <= 1) {
        setShowAddedDocuments(false);
      }
      setSuccess('Legacy document deleted successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Legacy document endpoint not found. Please check the server configuration or contact support.');
      } else {
        setError(error.response?.data?.message || 'Failed to delete legacy document');
      }
      console.error('Delete legacy document error:', error);
    }
  };

  return (
    <div className="section legacy-section">
      <h3>
        Personal and Emotional Legacy
        
      </h3>
      <div className={`section-content} overflow-y-auto max-h-[500px]`}>
        {/* Legacy Details Table */}
        
        {showAddedDocuments && (
          <div className="table-container mt-6">
        
            {addedDocuments.length === 0 ? (
              <p className="text-gray-500">No legacy details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Message</th>
                    <th className="border p-2">View File</th>
                   
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.type !== 'Select Type' ? item.type : 'N/A'}</td>
                      <td className="border p-2">{item.message || 'N/A'}</td>
                      <td className="border p-2">
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View File
                          </a>
                        ) : (
                          'No file uploaded'
                        )}
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

export default LegacySection;