import React, { useState } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';

const FamilySection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([
    {
      id: 1,
      name: '',
      relation: 'Select Relation',
      aadhar: '',
      pan: '',
      passport: '',
      voterId: '',
      drivingLicense: '',
      file: null,
    },
  ]);
  const [familyValidationErrors, setFamilyValidationErrors] = useState([
    { id: 1, aadhar: '', pan: '', passport: '', voterId: '', drivingLicense: '' },
  ]);
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);

  const relationOptions = [
    'Select Relation',
    'Father',
    'Mother',
    'Son',
    'Daughter',
    'Brother',
    'Sister',
    'Grandfather',
    'Grandmother',
    'Grandson',
    'Granddaughter',
    'Uncle',
    'Aunt',
    'Nephew',
    'Niece',
    'Cousin',
    'Spouse',
    'Father-in-law',
    'Mother-in-law',
    'Brother-in-law',
    'Sister-in-law',
    'Other',
  ];

  const validateInput = (documentType, value) => {
    if (documentType === 'Aadhar' && value && !/^\d{12}$/.test(value)) {
      return 'Aadhar must be a 12-digit number';
    }
    if (documentType === 'Pan' && value && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(value)) {
      return 'PAN must be in format ABCDE1234F';
    }
    if (documentType === 'Passport' && value && !/^[A-Z]{1}\d{7}$/.test(value)) {
      return 'Passport must be in format A1234567';
    }
    if (documentType === 'Voter Id' && value && !/^[A-Z]{3}\d{7}$/.test(value)) {
      return 'Voter ID must be in format ABC1234567';
    }
    if (documentType === 'Driving License' && value && !/^[A-Z]{2}\d{13}$/.test(value)) {
      return 'Driving License must be in format AB1234567890123';
    }
    return '';
  };

  const handleFamilyMemberChange = (id, field, value) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
    if (['aadhar', 'pan', 'passport', 'voterId', 'drivingLicense'].includes(field)) {
      const error = validateInput(field.charAt(0).toUpperCase() + field.slice(1), value);
      setFamilyValidationErrors((prev) =>
        prev.map((err) =>
          err.id === id ? { ...err, [field]: error } : err
        )
      );
    }
    setError('');
    setSuccess('');
  };

  const handleFamilyFileChange = (id) => (e) => {
    const file = e.target.files[0];
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, file } : member
      )
    );
  };

  const addFamilyMember = () => {
    const lastMember = familyMembers[familyMembers.length - 1];
    if (
      lastMember.name ||
      lastMember.relation !== 'Select Relation' ||
      lastMember.aadhar ||
      lastMember.pan ||
      lastMember.passport ||
      lastMember.voterId ||
      lastMember.drivingLicense ||
      lastMember.file
    ) {
      setShowAddedDocuments(true);
    }
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: '',
        relation: 'Select Relation',
        aadhar: '',
        pan: '',
        passport: '',
        voterId: '',
        drivingLicense: '',
        file: null,
      },
    ]);
    setFamilyValidationErrors((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        aadhar: '',
        pan: '',
        passport: '',
        voterId: '',
        drivingLicense: '',
      },
    ]);
  };

  const deleteFamilyMember = (id) => {
    setFamilyMembers((prev) => prev.filter((member) => member.id !== id));
    setFamilyValidationErrors((prev) => prev.filter((err) => err.id !== id));
    if (
      familyMembers.filter(
        (member) =>
          member.name ||
          member.relation !== 'Select Relation' ||
          member.aadhar ||
          member.pan ||
          member.passport ||
          member.voterId ||
          member.drivingLicense ||
          member.file
      ).length <= 1
    ) {
      setShowAddedDocuments(false);
    }
  };

  const handleSectionSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hasErrors = familyValidationErrors.some((err) =>
      Object.values(err).some((val, idx) => idx !== 0 && val)
    );
    if (hasErrors) {
      setError('Please correct the validation errors before submitting');
      return;
    }

    console.log({ familyMembers });
    handleSubmit(e);
  };

  return (
    <form className="section family-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Family Members
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        <div className="table-container mb-6">
          <h4>Family Member Details</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Relation</th>
                <th className="border p-2">Aadhar</th>
                <th className="border p-2">PAN</th>
                <th className="border p-2">Passport</th>
                <th className="border p-2">Voter ID</th>
                <th className="border p-2">Driving License</th>
                <th className="border p-2">Upload File</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {familyMembers.map((member, index) => (
                <tr key={member.id} className="table-row">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleFamilyMemberChange(member.id, 'name', e.target.value)}
                      className="w-full p-1"
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      value={member.relation}
                      onChange={(e) => handleFamilyMemberChange(member.id, 'relation', e.target.value)}
                      className="w-full p-1"
                    >
                      {relationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={member.aadhar}
                      onChange={(e) => handleFamilyMemberChange(member.id, 'aadhar', e.target.value)}
                      className={`w-full p-1 ${familyValidationErrors.find((err) => err.id === member.id)?.aadhar ? 'border-red-500' : ''}`}
                    />
                    {familyValidationErrors.find((err) => err.id === member.id)?.aadhar && (
                      <p className="text-red-500 text-sm mt-1">
                        {familyValidationErrors.find((err) => err.id === member.id).aadhar}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={member.pan}
                      onChange={(e) => handleFamilyMemberChange(member.id, 'pan', e.target.value)}
                      className={`w-full p-1 ${familyValidationErrors.find((err) => err.id === member.id)?.pan ? 'border-red-500' : ''}`}
                    />
                    {familyValidationErrors.find((err) => err.id === member.id)?.pan && (
                      <p className="text-red-500 text-sm mt-1">
                        {familyValidationErrors.find((err) => err.id === member.id).pan}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={member.passport}
                      onChange={(e) => handleFamilyMemberChange(member.id, 'passport', e.target.value)}
                      className={`w-full p-1 ${familyValidationErrors.find((err) => err.id === member.id)?.passport ? 'border-red-500' : ''}`}
                    />
                    {familyValidationErrors.find((err) => err.id === member.id)?.passport && (
                      <p className="text-red-500 text-sm mt-1">
                        {familyValidationErrors.find((err) => err.id === member.id).passport}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={member.voterId}
                      onChange={(e) => handleFamilyMemberChange(member.id, 'voterId', e.target.value)}
                      className={`w-full p-1 ${familyValidationErrors.find((err) => err.id === member.id)?.voterId ? 'border-red-500' : ''}`}
                    />
                    {familyValidationErrors.find((err) => err.id === member.id)?.voterId && (
                      <p className="text-red-500 text-sm mt-1">
                        {familyValidationErrors.find((err) => err.id === member.id).voterId}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={member.drivingLicense}
                      onChange={(e) => handleFamilyMemberChange(member.id, 'drivingLicense', e.target.value)}
                      className={`w-full p-1 ${familyValidationErrors.find((err) => err.id === member.id)?.drivingLicense ? 'border-red-500' : ''}`}
                    />
                    {familyValidationErrors.find((err) => err.id === member.id)?.drivingLicense && (
                      <p className="text-red-500 text-sm mt-1">
                        {familyValidationErrors.find((err) => err.id === member.id).drivingLicense}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    <input
                      type="file"
                      onChange={handleFamilyFileChange(member.id)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png"
                    />
                    {member.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {member.file.name}</p>}
                  </td>
                  <td className="border p-2">
                    {index === familyMembers.length - 1 ? (
                      <button
                        onClick={addFamilyMember}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteFamilyMember(member.id)}
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
        {showAddedDocuments && (
          <div className="table-container mt-6">
            <h4>Added Family Members</h4>
            {familyMembers.filter(
              (member) =>
                member.name ||
                member.relation !== 'Select Relation' ||
                member.aadhar ||
                member.pan ||
                member.passport ||
                member.voterId ||
                member.drivingLicense ||
                member.file
            ).length === 0 ? (
              <p className="text-gray-500">No family members added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Relation</th>
                    <th className="border p-2">Aadhar</th>
                    <th className="border p-2">PAN</th>
                    <th className="border p-2">Passport</th>
                    <th className="border p-2">Voter ID</th>
                    <th className="border p-2">Driving License</th>
                    <th className="border p-2">View File</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {familyMembers
                    .filter(
                      (member) =>
                        member.name ||
                        member.relation !== 'Select Relation' ||
                        member.aadhar ||
                        member.pan ||
                        member.passport ||
                        member.voterId ||
                        member.drivingLicense ||
                        member.file
                    )
                    .map((member) => (
                      <tr key={member.id} className="table-row">
                        <td className="border p-2">{member.name || 'N/A'}</td>
                        <td className="border p-2">{member.relation !== 'Select Relation' ? member.relation : 'N/A'}</td>
                        <td className="border p-2">{member.aadhar || 'N/A'}</td>
                        <td className="border p-2">{member.pan || 'N/A'}</td>
                        <td className="border p-2">{member.passport || 'N/A'}</td>
                        <td className="border p-2">{member.voterId || 'N/A'}</td>
                        <td className="border p-2">{member.drivingLicense || 'N/A'}</td>
                        <td className="border p-2">{member.file ? member.file.name : 'No file uploaded'}</td>
                        <td className="border p-2">
                          <button
                            onClick={() => deleteFamilyMember(member.id)}
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

export default FamilySection;