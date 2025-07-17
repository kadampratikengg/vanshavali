import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const EducationSection = ({ setError, setSuccess, userId, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [educationData, setEducationData] = useState({
    Education: [{ id: 1, level: 'Select Level', number: '', dateOfPassing: '', file: null, fileUuid: null }],
    Employment: [{ id: 1, companyName: '', joinDate: '', exitDate: '', file: null, fileUuid: null }],
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

  const educationLevelOptions = [
    'Select Level',
    'SSC',
    'HSC',
    'Degree',
    'Diploma',
    'Postgraduate',
    'Doctorate',
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

    Object.keys(educationData).forEach((section) => {
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
        setEducationData(fetchedData || {
          Education: [{ id: 1, level: 'Select Level', number: '', dateOfPassing: '', file: null, fileUuid: null }],
          Employment: [{ id: 1, companyName: '', joinDate: '', exitDate: '', file: null, fileUuid: null }],
        });
        setAddedDocuments({
          Education: fetchedData?.Education?.map(item => ({
            id: item._id,
            level: item.level,
            number: item.number,
            dateOfPassing: item.dateOfPassing,
            fileUrl: item.fileUrl,
          })) || [],
          Employment: fetchedData?.Employment?.map(item => ({
            id: item._id,
            companyName: item.companyName,
            joinDate: item.joinDate,
            exitDate: item.exitDate,
            fileUrl: item.fileUrl,
          })) || [],
        });
        setShowAddedDocuments({
          education: fetchedData?.Education?.length > 0,
          employment: fetchedData?.Employment?.length > 0,
        });
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Education endpoint not found, using default data');
          setEducationData({
            Education: [{ id: 1, level: 'Select Level', number: '', dateOfPassing: '', file: null, fileUuid: null }],
            Employment: [{ id: 1, companyName: '', joinDate: '', exitDate: '', file: null, fileUuid: null }],
          });
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
        }
      }
    };
    fetchEducationData();
  }, [setError, token]);

  const handleTableChange = (section, id, field, value) => {
    setEducationData((prev) => ({
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
    const lastRow = educationData[section][educationData[section].length - 1];
    const hasData = Object.values(lastRow).some((val, idx) => idx !== 0 && val && val !== 'Select Level');
    if (!hasData || !lastRow.fileUuid) {
      setError(`Please fill at least one field, select a valid level, and upload a file for ${section} before adding.`);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/education/document`,
        {
          ...(section === 'Education' ? {
            level: lastRow.level,
            number: lastRow.number,
            dateOfPassing: lastRow.dateOfPassing,
          } : {
            companyName: lastRow.companyName,
            joinDate: lastRow.joinDate,
            exitDate: lastRow.exitDate,
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
            ...(section === 'Education' ? {
              level: lastRow.level,
              number: lastRow.number,
              dateOfPassing: lastRow.dateOfPassing,
            } : {
              companyName: lastRow.companyName,
              joinDate: lastRow.joinDate,
              exitDate: lastRow.exitDate,
            }),
            fileUrl: newDocument.fileUrl,
          },
        ],
      }));
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: true }));
      setEducationData((prev) => ({
        ...prev,
        [section]: [
          {
            id: prev[section].length + 1,
            ...(section === 'Education'
              ? { level: 'Select Level', number: '', dateOfPassing: '', file: null, fileUuid: null }
              : { companyName: '', joinDate: '', exitDate: '', file: null, fileUuid: null }),
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
      await axios.delete(`${process.env.REACT_APP_API_URL}/education/document/${id}`, {
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

  const handleUpdateEducation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/education`,
        { educationData: addedDocuments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess('Education data updated successfully');
      setAddedDocuments({
        Education: response.data.educationData.Education?.map(item => ({
          id: item._id,
          level: item.level,
          number: item.number,
          dateOfPassing: item.dateOfPassing,
          fileUrl: item.fileUrl,
        })) || [],
        Employment: response.data.educationData.Employment?.map(item => ({
          id: item._id,
          companyName: item.companyName,
          joinDate: item.joinDate,
          exitDate: item.exitDate,
          fileUrl: item.fileUrl,
        })) || [],
      });
      setShowAddedDocuments({
        education: response.data.educationData.Education?.length > 0,
        employment: response.data.educationData.Employment?.length > 0,
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update education data');
      console.error('Update education error:', error);
    }
  };

  return (
    <form className="section education-section" onSubmit={handleUpdateEducation}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Education & Employment
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Education Table */}
        <div className="table-container mb-6">
          <h4>Education Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Level</th>
                <th className="border p-2">Number</th>
                <th className="border p-2">Date of Passing</th>
                <th className="border p-2">Upload Marksheet</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {educationData.Education.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <select
                      value={item.level}
                      onChange={(e) => handleTableChange('Education', item.id, 'level', e.target.value)}
                      className="w-full p-1"
                    >
                      {educationLevelOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.number}
                      onChange={(e) => handleTableChange('Education', item.id, 'number', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="date"
                      value={item.dateOfPassing}
                      onChange={(e) => handleTableChange('Education', item.id, 'dateOfPassing', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`Education_${item.id}`}
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
                      onClick={addTableRow('Education')}
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
        {showAddedDocuments.education && (
          <div className="table-container mt-6">
            <h4>Added Education Details</h4>
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
                    <th className="border p-2">Action</th>
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
                      <td className="border p-2">
                        <button
                          onClick={deleteTableRow('Education', item.id)}
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

        {/* Employment Table */}
        <div className="table-container mb-6">
          <h4>Employment Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Company Name</th>
                <th className="border p-2">Join Date</th>
                <th className="border p-2">Exit Date</th>
                <th className="border p-2">Upload Company Document</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {educationData.Employment.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.companyName}
                      onChange={(e) => handleTableChange('Employment', item.id, 'companyName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="date"
                      value={item.joinDate}
                      onChange={(e) => handleTableChange('Employment', item.id, 'joinDate', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="date"
                      value={item.exitDate}
                      onChange={(e) => handleTableChange('Employment', item.id, 'exitDate', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`Employment_${item.id}`}
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
                      onClick={addTableRow('Employment')}
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
        {showAddedDocuments.employment && (
          <div className="table-container mt-6">
            <h4>Added Employment Details</h4>
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
                    <th className="border p-2">Action</th>
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
                      <td className="border p-2">
                        <button
                          onClick={deleteTableRow('Employment', item.id)}
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
          Update Education Details
        </button>
      </div>
    </form>
  );
};

export default EducationSection;