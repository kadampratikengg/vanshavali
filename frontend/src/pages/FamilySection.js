import React, { useState, useEffect, useRef } from 'react';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const FamilySection = ({ setError, setSuccess, userId, token }) => {
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
      fileUuid: null,
    },
  ]);
  const [familyValidationErrors, setFamilyValidationErrors] = useState([
    { id: 1, aadhar: '', pan: '', passport: '', voterId: '', drivingLicense: '' },
  ]);
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);
  const [addedDocuments, setAddedDocuments] = useState([]);
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

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

    familyMembers.forEach((member) => {
      if (!widgetRefs.current[member.id]) {
        try {
          console.log(`Initializing Uploadcare widget for ID: ${member.id}`);
          const widget = window.uploadcare.Widget(`[data-uploadcare-id="${member.id}"]`);
          widget.onUploadComplete((file) => {
            console.log(`File uploaded for ID ${member.id}:`, file);
            setFamilyMembers((prev) =>
              prev.map((row) => (row.id === member.id ? { ...row, file, fileUuid: file.uuid } : row))
            );
          });
          widgetRefs.current[member.id] = widget;
          console.log(`Uploadcare widget initialized for ID: ${member.id}`);
        } catch (error) {
          setError('Failed to initialize Uploadcare widget');
          console.error('Uploadcare widget error for ID:', member.id, error);
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
  }, [uploadcareLoaded, familyMembers, setError]);

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/family`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { familyMembers: fetchedData } = response.data;
        setFamilyMembers(fetchedData?.length > 0 ? fetchedData.map((item, index) => ({
          id: index + 1,
          name: item.name,
          relation: item.relation,
          aadhar: item.aadhar,
          pan: item.pan,
          passport: item.passport,
          voterId: item.voterId,
          drivingLicense: item.drivingLicense,
          file: null,
          fileUuid: item.fileUrl ? item.fileUrl.split('/')[3] : null,
        })) : [{
          id: 1,
          name: '',
          relation: 'Select Relation',
          aadhar: '',
          pan: '',
          passport: '',
          voterId: '',
          drivingLicense: '',
          file: null,
          fileUuid: null,
        }]);
        setAddedDocuments(fetchedData?.map(item => ({
          id: item._id,
          name: item.name,
          relation: item.relation,
          aadhar: item.aadhar,
          pan: item.pan,
          passport: item.passport,
          voterId: item.voterId,
          drivingLicense: item.drivingLicense,
          fileUrl: item.fileUrl,
        })) || []);
        setShowAddedDocuments(fetchedData?.length > 0);
        setFamilyValidationErrors(fetchedData?.map((item, index) => ({
          id: index + 1,
          aadhar: '',
          pan: '',
          passport: '',
          voterId: '',
          drivingLicense: '',
        })) || [{ id: 1, aadhar: '', pan: '', passport: '', voterId: '', drivingLicense: '' }]);
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Family endpoint not found, using default data');
          setFamilyMembers([{
            id: 1,
            name: '',
            relation: 'Select Relation',
            aadhar: '',
            pan: '',
            passport: '',
            voterId: '',
            drivingLicense: '',
            file: null,
            fileUuid: null,
          }]);
          setAddedDocuments([]);
          setShowAddedDocuments(false);
          setFamilyValidationErrors([{ id: 1, aadhar: '', pan: '', passport: '', voterId: '', drivingLicense: '' }]);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch family data');
        }
      }
    };
    fetchFamilyData();
  }, [setError, token]);

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

  const addFamilyMember = async (e) => {
    e.preventDefault();
    const lastMember = familyMembers[familyMembers.length - 1];
    if (
      lastMember.relation === 'Select Relation' ||
      !lastMember.name ||
      !lastMember.fileUuid
    ) {
      setError('Please enter a name, select a valid relation, and upload a file before adding.');
      return;
    }

    const hasErrors = familyValidationErrors.some((err) =>
      Object.values(err).some((val, idx) => idx !== 0 && val)
    );
    if (hasErrors) {
      setError('Please correct the validation errors before adding');
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/family/document`,
        {
          name: lastMember.name,
          relation: lastMember.relation,
          aadhar: lastMember.aadhar,
          pan: lastMember.pan,
          passport: lastMember.passport,
          voterId: lastMember.voterId,
          drivingLicense: lastMember.drivingLicense,
          fileUrl: lastMember.fileUuid ? `https://ucarecdn.com/${lastMember.fileUuid}/` : '',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const newDocument = response.data.document;
      setAddedDocuments((prev) => [
        ...prev,
        {
          id: newDocument._id,
          name: newDocument.name,
          relation: newDocument.relation,
          aadhar: newDocument.aadhar,
          pan: newDocument.pan,
          passport: newDocument.passport,
          voterId: newDocument.voterId,
          drivingLicense: newDocument.drivingLicense,
          fileUrl: newDocument.fileUrl,
        },
      ]);
      setShowAddedDocuments(true);
      setFamilyMembers([{
        id: familyMembers.length + 1,
        name: '',
        relation: 'Select Relation',
        aadhar: '',
        pan: '',
        passport: '',
        voterId: '',
        drivingLicense: '',
        file: null,
        fileUuid: null,
      }]);
      setFamilyValidationErrors([{ id: familyMembers.length + 1, aadhar: '', pan: '', passport: '', voterId: '', drivingLicense: '' }]);
      setSuccess('Family member added successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save family member');
      console.error('Add family member error:', error);
    }
  };

  const deleteFamilyMember = (id) => async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/family/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddedDocuments((prev) => prev.filter((item) => item.id !== id));
      if (addedDocuments.length <= 1) {
        setShowAddedDocuments(false);
      }
      setSuccess('Family member deleted successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete family member');
      console.error('Delete family member error:', error);
    }
  };

  const handleUpdateFamily = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hasErrors = familyValidationErrors.some((err) =>
      Object.values(err).some((val, idx) => idx !== 0 && val)
    );
    if (hasErrors) {
      setError('Please correct the validation errors before updating');
      return;
    }

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/family`,
        { familyMembers: addedDocuments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess('Family data updated successfully');
      setAddedDocuments(response.data.familyMembers.map(item => ({
        id: item._id,
        name: item.name,
        relation: item.relation,
        aadhar: item.aadhar,
        pan: item.pan,
        passport: item.passport,
        voterId: item.voterId,
        drivingLicense: item.drivingLicense,
        fileUrl: item.fileUrl,
      })));
      setShowAddedDocuments(response.data.familyMembers.length > 0);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update family data');
      console.error('Update family error:', error);
    }
  };

  return (
    <form className="section family-section" onSubmit={handleUpdateFamily}>
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
              {familyMembers.map((member) => (
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
                    {uploadcareLoaded ? (
                      <div>
                        <input
                          type="hidden"
                          data-uploadcare-id={member.id}
                          data-public-key={process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY}
                          data-images-only="false"
                          data-max-size="104857600"
                          data-file-types=".pdf,.jpg,.png"
                          className="w-full"
                        />
                        {member.file && <p className="text-sm text-gray-500 mt-1">Uploaded: {member.file.name}</p>}
                      </div>
                    ) : (
                      <p className="text-gray-500">Loading uploader...</p>
                    )}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={addFamilyMember}
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
        {showAddedDocuments && (
          <div className="table-container mt-6">
            <h4>Added Family Members</h4>
            {addedDocuments.length === 0 ? (
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
                  {addedDocuments.map((member) => (
                    <tr key={member.id} className="table-row">
                      <td className="border p-2">{member.name || 'N/A'}</td>
                      <td className="border p-2">{member.relation !== 'Select Relation' ? member.relation : 'N/A'}</td>
                      <td className="border p-2">{member.aadhar || 'N/A'}</td>
                      <td className="border p-2">{member.pan || 'N/A'}</td>
                      <td className="border p-2">{member.passport || 'N/A'}</td>
                      <td className="border p-2">{member.voterId || 'N/A'}</td>
                      <td className="border p-2">{member.drivingLicense || 'N/A'}</td>
                      <td className="border p-2">
                        {member.fileUrl ? (
                          <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                            View File
                          </a>
                        ) : (
                          'No file uploaded'
                        )}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={deleteFamilyMember(member.id)}
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
          Update Family Details
        </button>
      </div>
    </form>
  );
};

export default FamilySection;