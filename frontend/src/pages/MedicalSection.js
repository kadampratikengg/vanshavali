import React, { useState } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';

const EducationSection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [educationData, setEducationData] = useState([
    { id: 1, level: 'Select Level', number: '', dateOfPassing: '', file: null },
  ]);
  const [employmentData, setEmploymentData] = useState([
    { id: 1, companyName: '', joinDate: '', exitDate: '', file: null },
  ]);
  const [showAddedDocuments, setShowAddedDocuments] = useState({
    education: false,
    employment: false,
  });
  const [files, setFiles] = useState({});

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

  const handleTableChange = (section, id, field, value) => {
    const setState = {
      Education: setEducationData,
      Employment: setEmploymentData,
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
      Education: setEducationData,
      Employment: setEmploymentData,
    }[section];
    setState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file } : item))
    );
    setFiles((prev) => ({ ...prev, [`${section}_${id}`]: file }));
  };

  const addTableRow = (section) => {
    const setState = {
      Education: setEducationData,
      Employment: setEmploymentData,
    }[section];
    const lastRow = {
      Education: educationData[educationData.length - 1],
      Employment: employmentData[employmentData.length - 1],
    }[section];
    const hasData = Object.values(lastRow).some((val, idx) => idx !== 0 && val && val !== 'Select Level');
    if (hasData) {
      setShowAddedDocuments((prev) => ({ ...prev, [section.toLowerCase()]: true }));
    }
    setState((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        ...(section === 'Education'
          ? { level: 'Select Level', number: '', dateOfPassing: '', file: null }
          : { companyName: '', joinDate: '', exitDate: '', file: null }),
      },
    ]);
  };

  const deleteTableRow = (section, id) => {
    const setState = {
      Education: setEducationData,
      Employment: setEmploymentData,
    }[section];
    setState((prev) => prev.filter((item) => item.id !== id));
    const data = {
      Education: educationData,
      Employment: employmentData,
    }[section];
    if (
      data.filter((item) => Object.values(item).some((val, idx) => idx !== 0 && val && val !== 'Select Level')).length <= 1
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
    console.log({ educationData, employmentData, files });
    handleSubmit(e);
  };

  return (
    <form className="section education-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Education & Employment
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        {/* Education Table */}
        <div className="table-scroll">
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
                {educationData.map((item, index) => (
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
                      <input
                        type="file"
                        onChange={handleTableFileChange('Education', item.id)}
                        className="w-full p-2 border rounded"
                        accept=".pdf,.jpg,.png"
                      />
                      {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                    </td>
                    <td className="border p-2">
                      {index === educationData.length - 1 ? (
                        <button
                          onClick={() => addTableRow('Education')}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Add
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteTableRow('Education', item.id)}
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
        {showAddedDocuments.education && (
          <div className="table-scroll">
            <div className="table-container mt-6">
              <h4>Added Education Details</h4>
              {educationData.filter((item) => item.level !== 'Select Level' || item.number || item.dateOfPassing || item.file).length === 0 ? (
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
                    {educationData
                      .filter((item) => item.level !== 'Select Level' || item.number || item.dateOfPassing || item.file)
                      .map((item) => (
                        <tr key={item.id} className="table-row">
                          <td className="border p-2">{item.level !== 'Select Level' ? item.level : 'N/A'}</td>
                          <td className="border p-2">{item.number || 'N/A'}</td>
                          <td className="border p-2">{item.dateOfPassing || 'N/A'}</td>
                          <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                          <td className="border p-2">
                            <button
                              onClick={() => deleteTableRow('Education', item.id)}
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

        {/* Employment Table */}
        <div className="table-scroll">
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
                {employmentData.map((item, index) => (
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
                      <input
                        type="file"
                        onChange={handleTableFileChange('Employment', item.id)}
                        className="w-full p-2 border rounded"
                        accept=".pdf,.jpg,.png"
                      />
                      {item.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {item.file.name}</p>}
                    </td>
                    <td className="border p-2">
                      {index === employmentData.length - 1 ? (
                        <button
                          onClick={() => addTableRow('Employment')}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Add
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteTableRow('Employment', item.id)}
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
        {showAddedDocuments.employment && (
          <div className="table-scroll">
            <div className="table-container mt-6">
              <h4>Added Employment Details</h4>
              {employmentData.filter((item) => item.companyName || item.joinDate || item.exitDate || item.file).length === 0 ? (
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
                    {employmentData
                      .filter((item) => item.companyName || item.joinDate || item.exitDate || item.file)
                      .map((item) => (
                        <tr key={item.id} className="table-row">
                          <td className="border p-2">{item.companyName || 'N/A'}</td>
                          <td className="border p-2">{item.joinDate || 'N/A'}</td>
                          <td className="border p-2">{item.exitDate || 'N/A'}</td>
                          <td className="border p-2">{item.file ? item.file.name : 'No file uploaded'}</td>
                          <td className="border p-2">
                            <button
                              onClick={() => deleteTableRow('Employment', item.id)}
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

export default EducationSection;