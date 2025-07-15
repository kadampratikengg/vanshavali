import React, { useState } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';

const FinancialSection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [financialData, setFinancialData] = useState({
    BankDetails: [{ id: 1, bankName: '', accountNumber: '', ifsc: '', file: null }],
    FixedDeposits: [{ id: 1, bankName: '', fdAccountNumber: '', ifsc: '', file: null }],
    MutualFunds: [{ id: 1, schemeName: '', fundManager: '', typeOfScheme: '', file: null }],
    PfDetails: '',
    InsurancePolicies: [{ id: 1, policyName: '', policyNumber: '', file: null }],
    BusinessOwnership: [{ id: 1, businessName: '', investment: '', file: null }],
    CryptoAccounts: [{ id: 1, vendor: '', accountName: '', file: null }],
  });
  const [showAddedDocuments, setShowAddedDocuments] = useState({
    bankDetails: false,
    fixedDeposits: false,
    mutualFunds: false,
    insurancePolicies: false,
    businessOwnership: false,
    cryptoAccounts: false,
  });

  const handleFinancialTableChange = (section, id, field, value) => {
    setFinancialData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleFinancialFileChange = (section, id) => (e) => {
    const file = e.target.files[0];
    setFinancialData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, file } : item
      ),
    }));
  };

  const addFinancialRow = (section) => {
    const lastRow = financialData[section][financialData[section].length - 1];
    const hasData = Object.values(lastRow).some((val, idx) => idx !== 0 && val);
    if (hasData) {
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: true }));
    }
    setFinancialData((prev) => {
      const newRow = {
        id: prev[section].length + 1,
        ...(section === 'BankDetails' ? { bankName: '', accountNumber: '', ifsc: '', file: null } :
          section === 'FixedDeposits' ? { bankName: '', fdAccountNumber: '', ifsc: '', file: null } :
          section === 'MutualFunds' ? { schemeName: '', fundManager: '', typeOfScheme: '', file: null } :
          section === 'InsurancePolicies' ? { policyName: '', policyNumber: '', file: null } :
          section === 'BusinessOwnership' ? { businessName: '', investment: '', file: null } :
          section === 'CryptoAccounts' ? { vendor: '', accountName: '', file: null } : {})
      };
      return {
        ...prev,
        [section]: [...prev[section], newRow],
      };
    });
  };

  const deleteFinancialRow = (section, id) => {
    setFinancialData((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== id),
    }));
    if (
      financialData[section].filter((item) =>
        Object.values(item).some((val, idx) => idx !== 0 && val)
      ).length <= 1
    ) {
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFinancialData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSectionSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log({ financialData });
    handleSubmit(e);
  };

  return (
    <form className="section financial-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Financial Records
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Bank Details */}
        <div className="table-container mb-6">
          <h4>Bank Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Bank Name</th>
                <th className="border p-2">Account Number</th>
                <th className="border p-2">IFSC</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.BankDetails.map((item, index) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.bankName}
                      onChange={(e) => handleFinancialTableChange('BankDetails', item.id, 'bankName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.accountNumber}
                      onChange={(e) => handleFinancialTableChange('BankDetails', item.id, 'accountNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.ifsc}
                      onChange={(e) => handleFinancialTableChange('BankDetails', item.id, 'ifsc', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="file"
                      onChange={handleFinancialFileChange('BankDetails', item.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === financialData.BankDetails.length - 1 ? (
                      <button
                        onClick={() => addFinancialRow('BankDetails')}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteFinancialRow('BankDetails', item.id)}
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
        {showAddedDocuments.bankDetails && (
          <div className="table-container mt-6">
            <h4>Added Bank Details</h4>
            {financialData.BankDetails.filter((item) => item.bankName || item.accountNumber || item.ifsc || item.file).length === 0 ? (
              <p className="text-gray-500">No bank details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Bank Name</th>
                    <th className="border p-2">Account Number</th>
                    <th className="border p-2">IFSC</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.BankDetails.filter((item) => item.bankName || item.accountNumber || item.ifsc || item.file).map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.bankName || 'N/A'}</td>
                      <td className="border p-2">{item.accountNumber || 'N/A'}</td>
                      <td className="border p-2">{item.ifsc || 'N/A'}</td>
                      <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteFinancialRow('BankDetails', item.id)}
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

        {/* Fixed Deposits */}
        <div className="table-container mb-6">
          <h4>Fixed Deposits</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Bank Name</th>
                <th className="border p-2">FD Account Number</th>
                <th className="border p-2">IFSC</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.FixedDeposits.map((item, index) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.bankName}
                      onChange={(e) => handleFinancialTableChange('FixedDeposits', item.id, 'bankName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.fdAccountNumber}
                      onChange={(e) => handleFinancialTableChange('FixedDeposits', item.id, 'fdAccountNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.ifsc}
                      onChange={(e) => handleFinancialTableChange('FixedDeposits', item.id, 'ifsc', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="file"
                      onChange={handleFinancialFileChange('FixedDeposits', item.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === financialData.FixedDeposits.length - 1 ? (
                      <button
                        onClick={() => addFinancialRow('FixedDeposits')}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteFinancialRow('FixedDeposits', item.id)}
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
        {showAddedDocuments.fixedDeposits && (
          <div className="table-container mt-6">
            <h4>Added Fixed Deposits</h4>
            {financialData.FixedDeposits.filter((item) => item.bankName || item.fdAccountNumber || item.ifsc || item.file).length === 0 ? (
              <p className="text-gray-500">No fixed deposits added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Bank Name</th>
                    <th className="border p-2">FD Account Number</th>
                    <th className="border p-2">IFSC</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.FixedDeposits.filter((item) => item.bankName || item.fdAccountNumber || item.ifsc || item.file).map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.bankName || 'N/A'}</td>
                      <td className="border p-2">{item.fdAccountNumber || 'N/A'}</td>
                      <td className="border p-2">{item.ifsc || 'N/A'}</td>
                      <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteFinancialRow('FixedDeposits', item.id)}
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

        {/* Mutual Funds */}
        <div className="table-container mb-6">
          <h4>Mutual Funds</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Scheme Name</th>
                <th className="border p-2">Fund Manager</th>
                <th className="border p-2">Type of Scheme</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.MutualFunds.map((item, index) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.schemeName}
                      onChange={(e) => handleFinancialTableChange('MutualFunds', item.id, 'schemeName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.fundManager}
                      onChange={(e) => handleFinancialTableChange('MutualFunds', item.id, 'fundManager', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.typeOfScheme}
                      onChange={(e) => handleFinancialTableChange('MutualFunds', item.id, 'typeOfScheme', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="file"
                      onChange={handleFinancialFileChange('MutualFunds', item.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === financialData.MutualFunds.length - 1 ? (
                      <button
                        onClick={() => addFinancialRow('MutualFunds')}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteFinancialRow('MutualFunds', item.id)}
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
        {showAddedDocuments.mutualFunds && (
          <div className="table-container mt-6">
            <h4>Added Mutual Funds</h4>
            {financialData.MutualFunds.filter((item) => item.schemeName || item.fundManager || item.typeOfScheme || item.file).length === 0 ? (
              <p className="text-gray-500">No mutual funds added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Scheme Name</th>
                    <th className="border p-2">Fund Manager</th>
                    <th className="border p-2">Type of Scheme</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.MutualFunds.filter((item) => item.schemeName || item.fundManager || item.typeOfScheme || item.file).map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.schemeName || 'N/A'}</td>
                      <td className="border p-2">{item.fundManager || 'N/A'}</td>
                      <td className="border p-2">{item.typeOfScheme || 'N/A'}</td>
                      <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteFinancialRow('MutualFunds', item.id)}
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

        {/* PF Details */}
        <div className="table-container mb-6">
          <h4>PF Details</h4>
          <div className="form-grid">
            <div className="form-row">
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label htmlFor="PfDetails">PF Number:</label>
                  <input
                    type="text"
                    id="PfDetails"
                    name="PfDetails"
                    value={financialData.PfDetails}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Policies */}
        <div className="table-container mb-6">
          <h4>Insurance Policies</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Policy Name</th>
                <th className="border p-2">Policy Number</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.InsurancePolicies.map((item, index) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.policyName}
                      onChange={(e) => handleFinancialTableChange('InsurancePolicies', item.id, 'policyName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.policyNumber}
                      onChange={(e) => handleFinancialTableChange('InsurancePolicies', item.id, 'policyNumber', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="file"
                      onChange={handleFinancialFileChange('InsurancePolicies', item.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === financialData.InsurancePolicies.length - 1 ? (
                      <button
                        onClick={() => addFinancialRow('InsurancePolicies')}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteFinancialRow('InsurancePolicies', item.id)}
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
        {showAddedDocuments.insurancePolicies && (
          <div className="table-container mt-6">
            <h4>Added Insurance Policies</h4>
            {financialData.InsurancePolicies.filter((item) => item.policyName || item.policyNumber || item.file).length === 0 ? (
              <p className="text-gray-500">No insurance policies added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Policy Name</th>
                    <th className="border p-2">Policy Number</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.InsurancePolicies.filter((item) => item.policyName || item.policyNumber || item.file).map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.policyName || 'N/A'}</td>
                      <td className="border p-2">{item.policyNumber || 'N/A'}</td>
                      <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteFinancialRow('InsurancePolicies', item.id)}
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

        {/* Business Ownership */}
        <div className="table-container mb-6">
          <h4>Business Ownership</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Business Name</th>
                <th className="border p-2">Investment</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.BusinessOwnership.map((item, index) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.businessName}
                      onChange={(e) => handleFinancialTableChange('BusinessOwnership', item.id, 'businessName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.investment}
                      onChange={(e) => handleFinancialTableChange('BusinessOwnership', item.id, 'investment', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="file"
                      onChange={handleFinancialFileChange('BusinessOwnership', item.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === financialData.BusinessOwnership.length - 1 ? (
                      <button
                        onClick={() => addFinancialRow('BusinessOwnership')}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteFinancialRow('BusinessOwnership', item.id)}
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
        {showAddedDocuments.businessOwnership && (
          <div className="table-container mt-6">
            <h4>Added Business Ownership</h4>
            {financialData.BusinessOwnership.filter((item) => item.businessName || item.investment || item.file).length === 0 ? (
              <p className="text-gray-500">No business ownership added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Business Name</th>
                    <th className="border p-2">Investment</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.BusinessOwnership.filter((item) => item.businessName || item.investment || item.file).map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.businessName || 'N/A'}</td>
                      <td className="border p-2">{item.investment || 'N/A'}</td>
                      <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteFinancialRow('BusinessOwnership', item.id)}
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

        {/* Crypto Accounts */}
        <div className="table-container mb-6">
          <h4>Crypto Accounts</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Vendor</th>
                <th className="border p-2">Account Name</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {financialData.CryptoAccounts.map((item, index) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.vendor}
                      onChange={(e) => handleFinancialTableChange('CryptoAccounts', item.id, 'vendor', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.accountName}
                      onChange={(e) => handleFinancialTableChange('CryptoAccounts', item.id, 'accountName', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="file"
                      onChange={handleFinancialFileChange('CryptoAccounts', item.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === financialData.CryptoAccounts.length - 1 ? (
                      <button
                        onClick={() => addFinancialRow('CryptoAccounts')}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteFinancialRow('CryptoAccounts', item.id)}
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
        {showAddedDocuments.cryptoAccounts && (
          <div className="table-container mt-6">
            <h4>Added Crypto Accounts</h4>
            {financialData.CryptoAccounts.filter((item) => item.vendor || item.accountName || item.file).length === 0 ? (
              <p className="text-gray-500">No crypto accounts added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Vendor</th>
                    <th className="border p-2">Account Name</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.CryptoAccounts.filter((item) => item.vendor || item.accountName || item.file).map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.vendor || 'N/A'}</td>
                      <td className="border p-2">{item.accountName || 'N/A'}</td>
                      <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => deleteFinancialRow('CryptoAccounts', item.id)}
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

export default FinancialSection;