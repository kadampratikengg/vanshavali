import React, { useState, useEffect, useRef } from 'react';
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
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

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
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Legacy endpoint not found, using default data');
          setAddedDocuments([]);
          setShowAddedDocuments(false);
          setError('Legacy data endpoint not found. Please check the server configuration.');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch legacy data');
          console.error('Fetch legacy data error:', error);
        }
      }
    };
    fetchLegacyData();
  }, [setError, token]);

  return (
    <div className="section legacy-section">
      <h3>Personal and Emotional Legacy</h3>
      <div className="section-content overflow-y-auto max-h-[500px]">
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