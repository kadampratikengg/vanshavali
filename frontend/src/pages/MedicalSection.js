import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const MedicalSection = ({ setError, setSuccess, userId, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [medicalData, setMedicalData] = useState({
    MedicalHistory: [{ id: 1, condition: '', bloodGroup: 'Select Blood Group', height: '', weight: '', file: null, fileUuid: null }],
    MedicalInsurance: [{ id: 1, provider: '', policyNumber: '', expiryDate: '', file: null, fileUuid: null }],
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

  const bloodGroupOptions = [
    'Select Blood Group',
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
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

    Object.keys(medicalData).forEach((section) => {
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
        setMedicalData(fetchedData || {
          MedicalHistory: [{ id: 1, condition: '', bloodGroup: 'Select Blood Group', height: '', weight: '', file: null, fileUuid: null }],
          MedicalInsurance: [{ id: 1, provider: '', policyNumber: '', expiryDate: '', file: null, fileUuid: null }],
        });
        setAddedDocuments({
          MedicalHistory: fetchedData?.MedicalHistory?.map(item => ({
            id: item._id,
            condition: item.condition,
            bloodGroup: item.bloodGroup,
            height: item.height,
            weight: item.weight,
            fileUrl: item.fileUrl,
          })) || [],
          MedicalInsurance: fetchedData?.MedicalInsurance?.map(item => ({
            id: item._id,
            provider: item.provider,
            policyNumber: item.policyNumber,
            expiryDate: item.expiryDate,
            fileUrl: item.fileUrl,
          })) || [],
        });
        setShowAddedDocuments({
          medicalHistory: fetchedData?.MedicalHistory?.length > 0,
          medicalInsurance: fetchedData?.MedicalInsurance?.length > 0,
        });
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Medical endpoint not found, using default data');
          setMedicalData({
            MedicalHistory: [{ id: 1, condition: '', bloodGroup: 'Select Blood Group', height: '', weight: '', file: null, fileUuid: null }],
            MedicalInsurance: [{ id: 1, provider: '', policyNumber: '', expiryDate: '', file: null, fileUuid: null }],
          });
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
        }
      }
    };
    fetchMedicalData();
  }, [setError, token]);

  const handleTableChange = (section, id, field, value) => {
    setMedicalData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    setError('');
    setSuccess('');
  };

  const addTableRow = (section) => async (e) => {
    e.preventDefault();
    const lastRow = medicalData[section][medicalData[section].length - 1];
    const hasData = Object.values(lastRow).some((val, idx) => idx !== 0 && val && val !== 'Select Blood Group');
    if (!hasData || !lastRow.fileUuid) {
      setError(`Please fill at least one field, select a valid blood group, and upload a file for ${section} before adding.`);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/medical/document`,
        {
          ...(section === 'MedicalHistory' ? {
            condition: lastRow.condition,
            bloodGroup: lastRow.bloodGroup,
            height: lastRow.height,
            weight: lastRow.weight,
          } : {
            provider: lastRow.provider,
            policyNumber: lastRow.policyNumber,
            expiryDate: lastRow.expiryDate,
          }),
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
            ...(section === 'MedicalHistory' ? {
              condition: lastRow.condition,
              bloodGroup: lastRow.bloodGroup,
              height: lastRow.height,
              weight: lastRow.weight,
            } : {
              provider: lastRow.provider,
              policyNumber: lastRow.policyNumber,
              expiryDate: lastRow.expiryDate,
            }),
            fileUrl: newDocument.fileUrl,
          },
        ],
      }));
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: true }));
      setMedicalData((prev) => ({
        ...prev,
        [section]: [
          {
            id: prev[section].length + 1,
            ...(section === 'MedicalHistory'
              ? { condition: '', bloodGroup: 'Select Blood Group', height: '', weight: '', file: null, fileUuid: null }
              : { provider: '', policyNumber: '', expiryDate: '', file: null, fileUuid: null }),
          },
        ],
      }));
      setSuccess(`${section} document added successfully`);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to save ${section.toLowerCase()} document`);
      console.error(`Add ${section} document error:`, error);
    }
  };

  const deleteTableRow = (section, id) => async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/medical/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddedDocuments((prev) => ({
        ...prev,
        [section]: prev[section].filter((item) => item.id !== id),
      }));
      if (addedDocuments[section].length <= 1) {
        setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: false }));
      }
      setSuccess(`${section} document deleted successfully`);
    } catch (error) {
      setError(error.response?.data?.message || `Failed to delete ${section.toLowerCase()} document`);
      console.error(`Delete ${section} document error:`, error);
    }
  };

  const handleUpdateMedical = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/medical`,
        { medicalData: addedDocuments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess('Medical data updated successfully');
      setAddedDocuments({
        MedicalHistory: response.data.medicalData.MedicalHistory?.map(item => ({
          id: item._id,
          condition: item.condition,
          bloodGroup: item.bloodGroup,
          height: item.height,
          weight: item.weight,
          fileUrl: item.fileUrl,
        })) || [],
        MedicalInsurance: response.data.medicalData.MedicalInsurance?.map(item => ({
          id: item._id,
          provider: item.provider,
          policyNumber: item.policyNumber,
          expiryDate: item.expiryDate,
          fileUrl: item.fileUrl,
        })) || [],
      });
      setShowAddedDocuments({
        medicalHistory: response.data.medicalData.MedicalHistory?.length > 0,
        medicalInsurance: response.data.medicalData.MedicalInsurance?.length > 0,
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update medical data');
      console.error('Update medical error:', error);
    }
  };

  return (
    <form className="section medical-section" onSubmit={handleUpdateMedical}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Medical History & Insurance
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Medical History Table */}
        <div className="table-container mb-6">
          <h4>Medical History Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Medical Condition</th>
                <th className="border p-2">Blood Group</th>
                <th className="border p-2">Height (cm)</th>
                <th className="border p-2">Weight (kg)</th>
                <th className="border p-2">Upload Medical Report</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {medicalData.MedicalHistory.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.condition}
                      onChange={(e) => handleTableChange('MedicalHistory', item.id, 'condition', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      value={item.bloodGroup}
                      onChange={(e) => handleTableChange('MedicalHistory', item.id, 'bloodGroup', e.target.value)}
                      className="w-full p-1"
                    >
                      {bloodGroupOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.height}
                      onChange={(e) => handleTableChange('MedicalHistory', item.id, 'height', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.weight}
                      onChange={(e) => handleTableChange('MedicalHistory', item.id, 'weight', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`MedicalHistory_${item.id}`}
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
                      onClick={addTableRow('MedicalHistory')}
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
        {showAddedDocuments.medicalHistory && (
          <div className="table-container mt-6">
            <h4>Added Medical History Details</h4>
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
                    <th className="border p-2">Action</th>
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
                      <td className="border p-2">
                        <button
                          onClick={deleteTableRow('MedicalHistory', item.id)}
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

        {/* Medical Insurance Table */}
        <div className="table-container mb-6">
          <h4>Medical Insurance Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Insurance Provider</th>
                <th className="border p-2">Policy Number</th>
                <th className="border p-2">Expiry Date</th>
                <th className="border p-2">Upload Insurance Document</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {medicalData.MedicalInsurance.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.provider}
                      onChange={(e) => handleTableChange('MedicalInsurance', item.id, 'provider', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.policyNumber}
                      onChange={(e) => handleTableChange('MedicalInsurance', item.id, 'policyNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) => handleTableChange('MedicalInsurance', item.id, 'expiryDate', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`MedicalInsurance_${item.id}`}
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
                      onClick={addTableRow('MedicalInsurance')}
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
        {showAddedDocuments.medicalInsurance && (
          <div className="table-container mt-6">
            <h4>Added Medical Insurance Details</h4>
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
                    <th className="border p-2">Action</th>
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
                      <td className="border p-2">
                        <button
                          onClick={deleteTableRow('MedicalInsurance', item.id)}
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
          type="submit"
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Update Medical Details
        </button>
      </div>
    </form>
  );
};

export default MedicalSection;