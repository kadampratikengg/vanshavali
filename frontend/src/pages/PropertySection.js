import React, { useState } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';

const PropertySection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState([
    { id: 1, propertyNumber: '', areaAddress: '', pincode: '', landType: 'Select Land Type', file: null },
  ]);
  const [vehicleDetails, setVehicleDetails] = useState([
    { id: 1, vehicleNumber: '', vehicleModel: '', vehicleInsurance: '', file: null },
  ]);
  const [transactionDetails, setTransactionDetails] = useState([
    { id: 1, type: 'Select Type', documentNumber: '', details: '', file: null },
  ]);
  const [showAddedDocuments, setShowAddedDocuments] = useState({
    propertyDetails: false,
    vehicleDetails: false,
    transactionDetails: false,
  });
  const [files, setFiles] = useState({});

  const landTypeOptions = ['Select Land Type', 'Residential', 'Commercial', 'Agricultural', 'Industrial'];
  const transactionTypeOptions = ['Select Type', 'Sale', 'Purchase', 'Agreements', 'Rent'];

  const handleTableChange = (section, id, field, value) => {
    const setState = {
      PropertyDetails: setPropertyDetails,
      VehicleDetails: setVehicleDetails,
      TransactionDetails: setTransactionDetails,
    }[section];
    setState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setError('');
    setSuccess('');
  };

  const handleTableFileChange = (section, id) => (e) => {
    const file = e.target.files[0];
    const setState = {
      PropertyDetails: setPropertyDetails,
      VehicleDetails: setVehicleDetails,
      TransactionDetails: setTransactionDetails,
    }[section];
    setState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file } : item))
    );
    setFiles((prev) => ({ ...prev, [`${section}_${id}`]: file }));
  };

  const addTableRow = (section) => {
    const setState = {
      PropertyDetails: setPropertyDetails,
      VehicleDetails: setVehicleDetails,
      TransactionDetails: setTransactionDetails,
    }[section];
    const lastRow = {
      PropertyDetails: propertyDetails[propertyDetails.length - 1],
      VehicleDetails: vehicleDetails[vehicleDetails.length - 1],
      TransactionDetails: transactionDetails[transactionDetails.length - 1],
    }[section];
    const hasData = Object.values(lastRow).some((val, idx) => idx !== 0 && val && val !== 'Select Land Type' && val !== 'Select Type');
    if (hasData) {
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: true }));
    }
    setState((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        ...(section === 'PropertyDetails'
          ? { propertyNumber: '', areaAddress: '', pincode: '', landType: 'Select Land Type', file: null }
          : section === 'VehicleDetails'
          ? { vehicleNumber: '', vehicleModel: '', vehicleInsurance: '', file: null }
          : { type: 'Select Type', documentNumber: '', details: '', file: null }),
      },
    ]);
  };

  const deleteTableRow = (section, id) => {
    const setState = {
      PropertyDetails: setPropertyDetails,
      VehicleDetails: setVehicleDetails,
      TransactionDetails: setTransactionDetails,
    }[section];
    setState((prev) => prev.filter((item) => item.id !== id));
    const data = {
      PropertyDetails: propertyDetails,
      VehicleDetails: vehicleDetails,
      TransactionDetails: transactionDetails,
    }[section];
    if (
      data.filter((item) =>
        Object.values(item).some((val, idx) => idx !== 0 && val && val !== 'Select Land Type' && val !== 'Select Type')
      ).length <= 1
    ) {
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: false }));
    }
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[`${section}_${id}`];
      return newFiles;
    });
  };

  const handleSectionSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log({ propertyDetails, vehicleDetails, transactionDetails, files });
    handleSubmit(e);
  };

  return (
    <form className="section property-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Property & Asset Information
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Property Details Table */}
        <div className="table-scroll">
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
                {propertyDetails.map((item, index) => (
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
                      <input
                        type="file"
                        onChange={handleTableFileChange('PropertyDetails', item.id)}
                        className="w-full p-2 border rounded"
                        accept=".pdf,.jpg,.png"
                      />
                      {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                    </td>
                    <td className="border p-2">
                      {index === propertyDetails.length - 1 ? (
                        <button
                          onClick={() => addTableRow('PropertyDetails')}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Add
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteTableRow('PropertyDetails', item.id)}
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
        </div>
        {showAddedDocuments.propertyDetails && (
          <div className="table-scroll">
            <div className="table-container mt-6">
              <h4>Added Property Details</h4>
              {propertyDetails.filter((item) => item.propertyNumber || item.areaAddress || item.pincode || item.landType !== 'Select Land Type' || item.file).length === 0 ? (
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
                    {propertyDetails
                      .filter((item) => item.propertyNumber || item.areaAddress || item.pincode || item.landType !== 'Select Land Type' || item.file)
                      .map((item) => (
                        <tr key={item.id} className="table-row">
                          <td className="border p-2">{item.propertyNumber || 'N/A'}</td>
                          <td className="border p-2">{item.areaAddress || 'N/A'}</td>
                          <td className="border p-2">{item.pincode || 'N/A'}</td>
                          <td className="border p-2">{item.landType !== 'Select Land Type' ? item.landType : 'N/A'}</td>
                          <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                          <td className="border p-2">
                            <button
                              onClick={() => deleteTableRow('PropertyDetails', item.id)}
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
          </div>
        )}

        {/* Vehicle Details Table */}
        <div className="table-scroll">
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
                {vehicleDetails.map((item, index) => (
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
                      <input
                        type="file"
                        onChange={handleTableFileChange('VehicleDetails', item.id)}
                        className="w-full p-2 border rounded"
                        accept=".pdf,.jpg,.png"
                      />
                      {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                    </td>
                    <td className="border p-2">
                      {index === vehicleDetails.length - 1 ? (
                        <button
                          onClick={() => addTableRow('VehicleDetails')}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Add
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteTableRow('VehicleDetails', item.id)}
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
        </div>
        {showAddedDocuments.vehicleDetails && (
          <div className="table-scroll">
            <div className="table-container mt-6">
              <h4>Added Vehicle Details</h4>
              {vehicleDetails.filter((item) => item.vehicleNumber || item.vehicleModel || item.vehicleInsurance || item.file).length === 0 ? (
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
                    {vehicleDetails
                      .filter((item) => item.vehicleNumber || item.vehicleModel || item.vehicleInsurance || item.file)
                      .map((item) => (
                        <tr key={item.id} className="table-row">
                          <td className="border p-2">{item.vehicleNumber || 'N/A'}</td>
                          <td className="border p-2">{item.vehicleModel || 'N/A'}</td>
                          <td className="border p-2">{item.vehicleInsurance || 'N/A'}</td>
                          <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                          <td className="border p-2">
                            <button
                              onClick={() => deleteTableRow('VehicleDetails', item.id)}
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
          </div>
        )}

        {/* Sale, Purchase, Agreements, Rent Details Table */}
        <div className="table-scroll">
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
                {transactionDetails.map((item, index) => (
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
                      <input
                        type="file"
                        onChange={handleTableFileChange('TransactionDetails', item.id)}
                        className="w-full p-2 border rounded"
                        accept=".pdf,.jpg,.png"
                      />
                      {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                    </td>
                    <td className="border p-2">
                      {index === transactionDetails.length - 1 ? (
                        <button
                          onClick={() => addTableRow('TransactionDetails')}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Add
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteTableRow('TransactionDetails', item.id)}
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
        </div>
        {showAddedDocuments.transactionDetails && (
          <div className="table-scroll">
            <div className="table-container mt-6">
              <h4>Added Sale, Purchase, Agreements, Rent Details</h4>
              {transactionDetails.filter((item) => item.type !== 'Select Type' || item.documentNumber || item.details || item.file).length === 0 ? (
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
                    {transactionDetails
                      .filter((item) => item.type !== 'Select Type' || item.documentNumber || item.details || item.file)
                      .map((item) => (
                        <tr key={item.id} className="table-row">
                          <td className="border p-2">{item.type !== 'Select Type' ? item.type : 'N/A'}</td>
                          <td className="border p-2">{item.documentNumber || 'N/A'}</td>
                          <td className="border p-2">{item.details || 'N/A'}</td>
                          <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                          <td className="border p-2">
                            <button
                              onClick={() => deleteTableRow('TransactionDetails', item.id)}
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
          </div>
        )}
      </div>
    </form>
  );
};

export default PropertySection;