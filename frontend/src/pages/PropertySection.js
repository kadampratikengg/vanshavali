import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const PropertySection = ({ setError, setSuccess, userId, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [propertyData, setPropertyData] = useState({
    PropertyDetails: [{ id: 1, propertyNumber: '', areaAddress: '', pincode: '', landType: 'Select Land Type', file: null, fileUuid: null }],
    VehicleDetails: [{ id: 1, vehicleNumber: '', vehicleModel: '', vehicleInsurance: '', file: null, fileUuid: null }],
    TransactionDetails: [{ id: 1, type: 'Select Type', documentNumber: '', details: '', file: null, fileUuid: null }],
  });
  const [showAddedDocuments, setShowAddedDocuments] = useState({
    propertyDetails: false,
    vehicleDetails: false,
    transactionDetails: false,
  });
  const [addedDocuments, setAddedDocuments] = useState({
    PropertyDetails: [],
    VehicleDetails: [],
    TransactionDetails: [],
  });
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

  const landTypeOptions = ['Select Land Type', 'Residential', 'Commercial', 'Agricultural', 'Industrial'];
  const transactionTypeOptions = ['Select Type', 'Sale', 'Purchase', 'Agreements', 'Rent'];

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

    Object.keys(propertyData).forEach((section) => {
      propertyData[section].forEach((item) => {
        if (!widgetRefs.current[`${section}_${item.id}`]) {
          try {
            console.log(`Initializing Uploadcare widget for ${section} ID: ${item.id}`);
            const widget = window.uploadcare.Widget(`[data-uploadcare-id="${section}_${item.id}"]`);
            widget.onUploadComplete((file) => {
              console.log(`File uploaded for ${section} ID ${item.id}:`, file);
              setPropertyData((prev) => ({
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
  }, [uploadcareLoaded, propertyData, setError]);

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/property`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { propertyData: fetchedData } = response.data;
        setPropertyData(fetchedData || {
          PropertyDetails: [{ id: 1, propertyNumber: '', areaAddress: '', pincode: '', landType: 'Select Land Type', file: null, fileUuid: null }],
          VehicleDetails: [{ id: 1, vehicleNumber: '', vehicleModel: '', vehicleInsurance: '', file: null, fileUuid: null }],
          TransactionDetails: [{ id: 1, type: 'Select Type', documentNumber: '', details: '', file: null, fileUuid: null }],
        });
        setAddedDocuments({
          PropertyDetails: fetchedData?.PropertyDetails?.map(item => ({
            id: item._id,
            propertyNumber: item.propertyNumber,
            areaAddress: item.areaAddress,
            pincode: item.pincode,
            landType: item.landType,
            fileUrl: item.fileUrl,
          })) || [],
          VehicleDetails: fetchedData?.VehicleDetails?.map(item => ({
            id: item._id,
            vehicleNumber: item.vehicleNumber,
            vehicleModel: item.vehicleModel,
            vehicleInsurance: item.vehicleInsurance,
            fileUrl: item.fileUrl,
          })) || [],
          TransactionDetails: fetchedData?.TransactionDetails?.map(item => ({
            id: item._id,
            type: item.type,
            documentNumber: item.documentNumber,
            details: item.details,
            fileUrl: item.fileUrl,
          })) || [],
        });
        setShowAddedDocuments({
          propertyDetails: fetchedData?.PropertyDetails?.length > 0,
          vehicleDetails: fetchedData?.VehicleDetails?.length > 0,
          transactionDetails: fetchedData?.TransactionDetails?.length > 0,
        });
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Property endpoint not found, using default data');
          setPropertyData({
            PropertyDetails: [{ id: 1, propertyNumber: '', areaAddress: '', pincode: '', landType: 'Select Land Type', file: null, fileUuid: null }],
            VehicleDetails: [{ id: 1, vehicleNumber: '', vehicleModel: '', vehicleInsurance: '', file: null, fileUuid: null }],
            TransactionDetails: [{ id: 1, type: 'Select Type', documentNumber: '', details: '', file: null, fileUuid: null }],
          });
          setAddedDocuments({
            PropertyDetails: [],
            VehicleDetails: [],
            TransactionDetails: [],
          });
          setShowAddedDocuments({
            propertyDetails: false,
            vehicleDetails: false,
            transactionDetails: false,
          });
        } else {
          setError(error.response?.data?.message || 'Failed to fetch property data');
        }
      }
    };
    fetchPropertyData();
  }, [setError, token]);

  const handleTableChange = (section, id, field, value) => {
    setPropertyData((prev) => ({
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
    const lastRow = propertyData[section][propertyData[section].length - 1];
    const hasData = Object.values(lastRow).some((val, idx) => idx !== 0 && val && val !== 'Select Land Type' && val !== 'Select Type');
    if (!hasData || !lastRow.fileUuid) {
      setError(`Please fill at least one field, select a valid type, and upload a file for ${section} before adding.`);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/property/document`,
        {
          ...(section === 'PropertyDetails' ? {
            propertyNumber: lastRow.propertyNumber,
            areaAddress: lastRow.areaAddress,
            pincode: lastRow.pincode,
            landType: lastRow.landType,
          } : section === 'VehicleDetails' ? {
            vehicleNumber: lastRow.vehicleNumber,
            vehicleModel: lastRow.vehicleModel,
            vehicleInsurance: lastRow.vehicleInsurance,
          } : {
            type: lastRow.type,
            documentNumber: lastRow.documentNumber,
            details: lastRow.details,
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
            ...(section === 'PropertyDetails' ? {
              propertyNumber: lastRow.propertyNumber,
              areaAddress: lastRow.areaAddress,
              pincode: lastRow.pincode,
              landType: lastRow.landType,
            } : section === 'VehicleDetails' ? {
              vehicleNumber: lastRow.vehicleNumber,
              vehicleModel: lastRow.vehicleModel,
              vehicleInsurance: lastRow.vehicleInsurance,
            } : {
              type: lastRow.type,
              documentNumber: lastRow.documentNumber,
              details: lastRow.details,
            }),
            fileUrl: newDocument.fileUrl,
          },
        ],
      }));
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: true }));
      setPropertyData((prev) => ({
        ...prev,
        [section]: [
          {
            id: prev[section].length + 1,
            ...(section === 'PropertyDetails'
              ? { propertyNumber: '', areaAddress: '', pincode: '', landType: 'Select Land Type', file: null, fileUuid: null }
              : section === 'VehicleDetails'
              ? { vehicleNumber: '', vehicleModel: '', vehicleInsurance: '', file: null, fileUuid: null }
              : { type: 'Select Type', documentNumber: '', details: '', file: null, fileUuid: null }),
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
      await axios.delete(`${process.env.REACT_APP_API_URL}/property/document/${id}`, {
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

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/property`,
        { propertyData: addedDocuments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess('Property data updated successfully');
      setAddedDocuments({
        PropertyDetails: response.data.propertyData.PropertyDetails?.map(item => ({
          id: item._id,
          propertyNumber: item.propertyNumber,
          areaAddress: item.areaAddress,
          pincode: item.pincode,
          landType: item.landType,
          fileUrl: item.fileUrl,
        })) || [],
        VehicleDetails: response.data.propertyData.VehicleDetails?.map(item => ({
          id: item._id,
          vehicleNumber: item.vehicleNumber,
          vehicleModel: item.vehicleModel,
          vehicleInsurance: item.vehicleInsurance,
          fileUrl: item.fileUrl,
        })) || [],
        TransactionDetails: response.data.propertyData.TransactionDetails?.map(item => ({
          id: item._id,
          type: item.type,
          documentNumber: item.documentNumber,
          details: item.details,
          fileUrl: item.fileUrl,
        })) || [],
      });
      setShowAddedDocuments({
        propertyDetails: response.data.propertyData.PropertyDetails?.length > 0,
        vehicleDetails: response.data.propertyData.VehicleDetails?.length > 0,
        transactionDetails: response.data.propertyData.TransactionDetails?.length > 0,
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update property data');
      console.error('Update property error:', error);
    }
  };

  return (
    <form className="section property-section" onSubmit={handleUpdateProperty}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Property & Asset Information
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Property Details Table */}
        <div className="table-container mb-6">
          <h4>Property Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Property Number</th>
                <th className="border p-2">Area/Address</th>
                <th className="border p-2">Pincode</th>
                <th className="border p-2">Land Type</th>
                <th className="border p-2">Upload 7/12 or Document</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {propertyData.PropertyDetails.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.propertyNumber}
                      onChange={(e) => handleTableChange('PropertyDetails', item.id, 'propertyNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.areaAddress}
                      onChange={(e) => handleTableChange('PropertyDetails', item.id, 'areaAddress', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.pincode}
                      onChange={(e) => handleTableChange('PropertyDetails', item.id, 'pincode', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      value={item.landType}
                      onChange={(e) => handleTableChange('PropertyDetails', item.id, 'landType', e.target.value)}
                      className="w-full p-1"
                    >
                      {landTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`PropertyDetails_${item.id}`}
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
                      onClick={addTableRow('PropertyDetails')}
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
        {showAddedDocuments.propertyDetails && (
          <div className="table-container mt-6">
            <h4>Added Property Details</h4>
            {addedDocuments.PropertyDetails.length === 0 ? (
              <p className="text-gray-500">No property details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Property Number</th>
                    <th className="border p-2">Area/Address</th>
                    <th className="border p-2">Pincode</th>
                    <th className="border p-2">Land Type</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.PropertyDetails.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.propertyNumber || 'N/A'}</td>
                      <td className="border p-2">{item.areaAddress || 'N/A'}</td>
                      <td className="border p-2">{item.pincode || 'N/A'}</td>
                      <td className="border p-2">{item.landType !== 'Select Land Type' ? item.landType : 'N/A'}</td>
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
                          onClick={deleteTableRow('PropertyDetails', item.id)}
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

        {/* Vehicle Details Table */}
        <div className="table-container mb-6">
          <h4>Vehicle Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Vehicle Number</th>
                <th className="border p-2">Vehicle Model</th>
                <th className="border p-2">Vehicle Insurance</th>
                <th className="border p-2">Upload Document</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {propertyData.VehicleDetails.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.vehicleNumber}
                      onChange={(e) => handleTableChange('VehicleDetails', item.id, 'vehicleNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.vehicleModel}
                      onChange={(e) => handleTableChange('VehicleDetails', item.id, 'vehicleModel', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.vehicleInsurance}
                      onChange={(e) => handleTableChange('VehicleDetails', item.id, 'vehicleInsurance', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`VehicleDetails_${item.id}`}
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
                      onClick={addTableRow('VehicleDetails')}
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
        {showAddedDocuments.vehicleDetails && (
          <div className="table-container mt-6">
            <h4>Added Vehicle Details</h4>
            {addedDocuments.VehicleDetails.length === 0 ? (
              <p className="text-gray-500">No vehicle details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Vehicle Number</th>
                    <th className="border p-2">Vehicle Model</th>
                    <th className="border p-2">Vehicle Insurance</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.VehicleDetails.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.vehicleNumber || 'N/A'}</td>
                      <td className="border p-2">{item.vehicleModel || 'N/A'}</td>
                      <td className="border p-2">{item.vehicleInsurance || 'N/A'}</td>
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
                          onClick={deleteTableRow('VehicleDetails', item.id)}
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

        {/* Transaction Details Table */}
        <div className="table-container mb-6">
          <h4>Sale, Purchase, Agreements, Rent Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Type</th>
                <th className="border p-2">Document Number</th>
                <th className="border p-2">Details</th>
                <th className="border p-2">Upload Document</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {propertyData.TransactionDetails.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <select
                      value={item.type}
                      onChange={(e) => handleTableChange('TransactionDetails', item.id, 'type', e.target.value)}
                      className="w-full p-1"
                    >
                      {transactionTypeOptions.map((option) => (
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
                      onChange={(e) => handleTableChange('TransactionDetails', item.id, 'documentNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.details}
                      onChange={(e) => handleTableChange('TransactionDetails', item.id, 'details', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={`TransactionDetails_${item.id}`}
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
                      onClick={addTableRow('TransactionDetails')}
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
        {showAddedDocuments.transactionDetails && (
          <div className="table-container mt-6">
            <h4>Added Sale, Purchase, Agreements, Rent Details</h4>
            {addedDocuments.TransactionDetails.length === 0 ? (
              <p className="text-gray-500">No transaction details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Document Number</th>
                    <th className="border p-2">Details</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.TransactionDetails.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.type !== 'Select Type' ? item.type : 'N/A'}</td>
                      <td className="border p-2">{item.documentNumber || 'N/A'}</td>
                      <td className="border p-2">{item.details || 'N/A'}</td>
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
                          onClick={deleteTableRow('TransactionDetails', item.id)}
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
          Update Property Details
        </button>
      </div>
    </form>
  );
};

export default PropertySection;