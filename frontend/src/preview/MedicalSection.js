import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MedicalSection = ({ setError, setSuccess, userId, token }) => {
  const [medicalData, setMedicalData] = useState({
    MedicalHistory: [{ id: 'temp-1', condition: '', bloodGroup: 'Select Blood Group', height: '', weight: '', file: null, fileUuid: null }],
    MedicalInsurance: [{ id: 'temp-1', provider: '', policyNumber: '', expiryDate: '', file: null, fileUuid: null }],
  });
  const [showAddedDocuments, setShowAddedDocuments] = useState({
    medicalHistory: false,
    medicalInsurance: false,
  });
  const [addedDocuments, setAddedDocuments] = useState({
    MedicalHistory: [],
    MedicalInsurance: [],
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

    Object.keys(medicalData).forEach((section) => {
      if (!Array.isArray(medicalData[section])) {
        console.error(`medicalData[${section}] is not an array:`, medicalData[section]);
        return;
      }
      medicalData[section].forEach((item) => {
        if (!widgetRefs.current[`${section}_${item.id}`]) {
          try {
            console.log(`Initializing Uploadcare widget for ${section} ID: ${item.id}`);
            const widget = window.uploadcare.Widget(`[data-uploadcare-id="${section}_${item.id}"]`);
            widget.onUploadComplete((file) => {
              console.log(`File uploaded for ${section} ID ${item.id}:`, file);
              setMedicalData((prev) => ({
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
  }, [uploadcareLoaded, medicalData, setError]);

  useEffect(() => {
    const fetchMedicalData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/medical`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { medicalData: fetchedData } = response.data;
        console.log('Fetched medical data:', fetchedData);
        if (!fetchedData || !fetchedData.MedicalHistory || !fetchedData.MedicalInsurance) {
          console.warn('Invalid medical data structure from server:', fetchedData);
          setAddedDocuments({
            MedicalHistory: [],
            MedicalInsurance: [],
          });
          setShowAddedDocuments({
            medicalHistory: false,
            medicalInsurance: false,
          });
          return;
        }
        setAddedDocuments({
          MedicalHistory: fetchedData.MedicalHistory?.map(item => ({
            id: item._id,
            condition: item.condition,
            bloodGroup: item.bloodGroup,
            height: item.height,
            weight: item.weight,
            fileUrl: item.fileUrl,
          })) || [],
          MedicalInsurance: fetchedData.MedicalInsurance?.map(item => ({
            id: item._id,
            provider: item.provider,
            policyNumber: item.policyNumber,
            expiryDate: item.expiryDate,
            fileUrl: item.fileUrl,
          })) || [],
        });
        setShowAddedDocuments({
          medicalHistory: fetchedData.MedicalHistory?.length > 0,
          medicalInsurance: fetchedData.MedicalInsurance?.length > 0,
        });
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Medical endpoint not found, using default data');
          setAddedDocuments({
            MedicalHistory: [],
            MedicalInsurance: [],
          });
          setShowAddedDocuments({
            medicalHistory: false,
            medicalInsurance: false,
          });
        } else {
          setError(error.response?.data?.message || 'Failed to fetch medical data');
          console.error('Fetch medical data error:', error);
        }
      }
    };
    fetchMedicalData();
  }, [setError, token]);

  return (
    <div className="section medical-section">
      <h3>Medical History & Insurance</h3>
      <div className="section-content overflow-y-auto max-h-[500px]">
        {/* Medical History Table */}
        {showAddedDocuments.medicalHistory && (
          <div className="table-container mt-6">
            <h4>Medical History Details</h4>
            {addedDocuments.MedicalHistory.length === 0 ? (
              <p className="text-gray-500">No medical history details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Medical Condition</th>
                    <th className="border p-2">Blood Group</th>
                    <th className="border p-2">Height (cm)</th>
                    <th className="border p-2">Weight (kg)</th>
                    <th className="border p-2">View File</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.MedicalHistory.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.condition || 'N/A'}</td>
                      <td className="border p-2">{item.bloodGroup !== 'Select Blood Group' ? item.bloodGroup : 'N/A'}</td>
                      <td className="border p-2">{item.height || 'N/A'}</td>
                      <td className="border p-2">{item.weight || 'N/A'}</td>
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

        {/* Medical Insurance Table */}
        {showAddedDocuments.medicalInsurance && (
          <div className="table-container mt-6">
            <h4>Medical Insurance Details</h4>
            {addedDocuments.MedicalInsurance.length === 0 ? (
              <p className="text-gray-500">No medical insurance details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Insurance Provider</th>
                    <th className="border p-2">Policy Number</th>
                    <th className="border p-2">Expiry Date</th>
                    <th className="border p-2">View File</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.MedicalInsurance.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.provider || 'N/A'}</td>
                      <td className="border p-2">{item.policyNumber || 'N/A'}</td>
                      <td className="border p-2">{item.expiryDate || 'N/A'}</td>
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

export default MedicalSection;