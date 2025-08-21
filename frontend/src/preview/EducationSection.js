import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EducationSection = ({ setError, setSuccess, userId, token }) => {
  const [educationData, setEducationData] = useState({
    Education: [{ id: 'temp-1', level: 'Select Level', number: '', dateOfPassing: '', file: null, fileUuid: null }],
    Employment: [{ id: 'temp-1', companyName: '', joinDate: '', exitDate: '', file: null, fileUuid: null }],
  });
  const [showAddedDocuments, setShowAddedDocuments] = useState({
    education: false,
    employment: false,
  });
  const [addedDocuments, setAddedDocuments] = useState({
    Education: [],
    Employment: [],
  });
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

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

    Object.keys(educationData).forEach((section) => {
      if (!Array.isArray(educationData[section])) {
        console.error(`educationData[${section}] is not an array:`, educationData[section]);
        return;
      }
      educationData[section].forEach((item) => {
        if (!widgetRefs.current[`${section}_${item.id}`]) {
          try {
            console.log(`Initializing Uploadcare widget for ${section} ID: ${item.id}`);
            const widget = window.uploadcare.Widget(`[data-uploadcare-id="${section}_${item.id}"]`);
            widget.onUploadComplete((file) => {
              console.log(`File uploaded for ${section} ID ${item.id}:`, file);
              setEducationData((prev) => ({
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
  }, [uploadcareLoaded, educationData, setError]);

  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/education`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { educationData: fetchedData } = response.data;
        console.log('Fetched education data:', fetchedData);
        if (!fetchedData || !fetchedData.Education || !fetchedData.Employment) {
          console.warn('Invalid education data structure from server:', fetchedData);
          setAddedDocuments({
            Education: [],
            Employment: [],
          });
          setShowAddedDocuments({
            education: false,
            employment: false,
          });
          return;
        }
        setAddedDocuments({
          Education: fetchedData.Education?.map(item => ({
            id: item._id,
            level: item.level,
            number: item.number,
            dateOfPassing: item.dateOfPassing,
            fileUrl: item.fileUrl,
          })) || [],
          Employment: fetchedData.Employment?.map(item => ({
            id: item._id,
            companyName: item.companyName,
            joinDate: item.joinDate,
            exitDate: item.exitDate,
            fileUrl: item.fileUrl,
          })) || [],
        });
        setShowAddedDocuments({
          education: fetchedData.Education?.length > 0,
          employment: fetchedData.Employment?.length > 0,
        });
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Education endpoint not found, using default data');
          setAddedDocuments({
            Education: [],
            Employment: [],
          });
          setShowAddedDocuments({
            education: false,
            employment: false,
          });
        } else {
          setError(error.response?.data?.message || 'Failed to fetch education data');
          console.error('Fetch education data error:', error);
        }
      }
    };
    fetchEducationData();
  }, [setError, token]);

  return (
    <div className="section education-section">
      <h3>Education & Employment</h3>
      <div className="section-content overflow-y-auto max-h-[500px]">
        {/* Education Table */}
        {showAddedDocuments.education && (
          <div className="table-container mt-6">
            <h4>Education Details</h4>
            {addedDocuments.Education.length === 0 ? (
              <p className="text-gray-500">No education details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Level</th>
                    <th className="border p-2">Number</th>
                    <th className="border p-2">Date of Passing</th>
                    <th className="border p-2">View File</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.Education.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.level !== 'Select Level' ? item.level : 'N/A'}</td>
                      <td className="border p-2">{item.number || 'N/A'}</td>
                      <td className="border p-2">{item.dateOfPassing || 'N/A'}</td>
                      <td className="border p-2">
                        {item.fileUrl ? (
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
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
        {/* Employment Table */}
        {showAddedDocuments.employment && (
          <div className="table-container mt-6">
            <h4>Employment Details</h4>
            {addedDocuments.Employment.length === 0 ? (
              <p className="text-gray-500">No employment details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Company Name</th>
                    <th className="border p-2">Join Date</th>
                    <th className="border p-2">Exit Date</th>
                    <th className="border p-2">View File</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.Employment.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.companyName || 'N/A'}</td>
                      <td className="border p-2">{item.joinDate || 'N/A'}</td>
                      <td className="border p-2">{item.exitDate || 'N/A'}</td>
                      <td className="border p-2">
                        {item.fileUrl ? (
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
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

export default EducationSection;