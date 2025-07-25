import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './FamilyTree.css';
import axios from 'axios';

const FamilyTree = ({ setIsAuthenticated, name }) => {
  const [error, setError] = useState('');
  const [familyCards, setFamilyCards] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [legalName, setLegalName] = useState('');
  const [personalData, setPersonalData] = useState({
    LegalName: '',
    AlternateName: '',
    DateOfBirth: '',
    PlaceOfBirth: '',
  });
  const [identityDocuments, setIdentityDocuments] = useState([]);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const navigate = useNavigate(); // Initialize navigate hook

  const relationOptions = useMemo(() => [
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
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token || !userId) {
          setError('Authentication required');
          return;
        }

        // Fetch Identity Data
        const identityResponse = await axios.get(`${process.env.REACT_APP_API_URL}/identity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { personalData, identityData } = identityResponse.data;
        setLegalName(personalData?.LegalName || name || 'User');
        setPersonalData(personalData || {
          LegalName: '',
          AlternateName: '',
          DateOfBirth: '',
          PlaceOfBirth: '',
        });
        const combinedDocuments = [
          ...(identityData?.Government || []),
          ...(identityData?.Other || []),
        ].map(item => ({
          id: item._id,
          documentType: item.documentType,
          documentNumber: item.documentNumber,
          fileUrl: item.fileUrl,
        }));
        setIdentityDocuments(combinedDocuments);

        // Fetch Family Data
        const familyResponse = await axios.get(`${process.env.REACT_APP_API_URL}/family`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { familyMembers } = familyResponse.data;

        // Ensure unique family members
        const uniqueMembers = [];
        const seenIds = new Set();
        familyMembers.forEach(member => {
          const identifier = `${member.aadhar || ''}-${member.pan || ''}-${member.passport || ''}`;
          if (!seenIds.has(identifier) && member.name && relationOptions.includes(member.relation)) {
            seenIds.add(identifier);
            uniqueMembers.push(member);
          }
        });

        // Include self data in family cards
        setFamilyCards([
          {
            _id: userId,
            name: personalData?.LegalName || name || 'User',
            relation: 'Self',
            aadhar: combinedDocuments.find(doc => doc.documentType === 'Aadhar')?.documentNumber || 'N/A',
            pan: combinedDocuments.find(doc => doc.documentType === 'Pan')?.documentNumber || 'N/A',
            passport: combinedDocuments.find(doc => doc.documentType === 'Passport')?.documentNumber || 'N/A',
            voterId: combinedDocuments.find(doc => doc.documentType === 'Voter Id')?.documentNumber || 'N/A',
            drivingLicense: combinedDocuments.find(doc => doc.documentType === 'Driving License')?.documentNumber || 'N/A',
            fileUrl: combinedDocuments[0]?.fileUrl || null,
          },
          ...uniqueMembers,
        ]);
      } catch (error) {
        console.error('Fetch data error:', error);
        setError(error.response?.data?.message || 'Failed to fetch family data');
      }
    };
    fetchData();
  }, [token, userId, name, relationOptions]);

  const handleCardClick = (member) => {
    if (member.relation === 'Self') {
      // Navigate to a new page with the user's identity data
      navigate('/member-details', {
        state: {
          member: {
            name: personalData.LegalName || 'User',
            relation: 'Self',
            aadhar: identityDocuments.find(doc => doc.documentType === 'Aadhar')?.documentNumber || 'N/A',
            pan: identityDocuments.find(doc => doc.documentType === 'Pan')?.documentNumber || 'N/A',
            passport: identityDocuments.find(doc => doc.documentType === 'Passport')?.documentNumber || 'N/A',
            voterId: identityDocuments.find(doc => doc.documentType === 'Voter Id')?.documentNumber || 'N/A',
            drivingLicense: identityDocuments.find(doc => doc.documentType === 'Driving License')?.documentNumber || 'N/A',
            fileUrl: identityDocuments[0]?.fileUrl || null,
            legalName: personalData.LegalName,
            alternateName: personalData.AlternateName,
            dateOfBirth: personalData.DateOfBirth,
            placeOfBirth: personalData.PlaceOfBirth,
            documents: identityDocuments,
          },
        },
      });
    } else {
      // Fetch family member details
      axios
        .get(`${process.env.REACT_APP_API_URL}/family/${member._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
          const memberData = response.data.familyMembers[0] || member;
          navigate('/member-details', {
            state: {
              member: {
                name: memberData.name,
                relation: memberData.relation,
                aadhar: memberData.aadhar || 'N/A',
                pan: memberData.pan || 'N/A',
                passport: memberData.passport || 'N/A',
                voterId: memberData.voterId || 'N/A',
                drivingLicense: memberData.drivingLicense || 'N/A',
                fileUrl: memberData.fileUrl || null,
                legalName: memberData.name,
                alternateName: 'N/A', // Family members don't have alternate name in current schema
                dateOfBirth: 'N/A', // Family members don't have DOB in current schema
                placeOfBirth: 'N/A', // Family members don't have POB in current schema
                documents: memberData.fileUrl ? [{ documentType: 'Family Document', fileUrl: memberData.fileUrl }] : [],
              },
            },
          });
          setToastMessage(`Viewing details for ${member.name}`);
          setTimeout(() => setToastMessage(''), 3000);
        })
        .catch(error => {
          console.error('Fetch member details error:', error);
          setError(error.response?.data?.message || 'Failed to fetch member details');
          setToastMessage('Error fetching member details');
          setTimeout(() => setToastMessage(''), 3000);
        });
    }
  };

  // Render family members as cards
  const renderFamilyCards = () => {
    const groupedByRelation = {
      grandparents: familyCards.filter(m => ['grandfather', 'grandmother'].includes(m.relation.toLowerCase())),
      parents: familyCards.filter(m => ['father', 'mother'].includes(m.relation.toLowerCase())),
      selfSpouse: familyCards.filter(m => ['self', 'spouse'].includes(m.relation.toLowerCase())),
      siblings: familyCards.filter(m => ['brother', 'sister'].includes(m.relation.toLowerCase())),
      siblingsChildren: familyCards.filter(m => ['son', 'daughter'].includes(m.relation.toLowerCase()) && familyCards.some(s => ['brother', 'sister'].includes(s.relation.toLowerCase()) && s._id === m.parentId)),
      others: familyCards.filter(m => !['grandfather', 'grandmother', 'father', 'mother', 'spouse', 'brother', 'sister', 'son', 'daughter', 'self'].includes(m.relation.toLowerCase())),
    };

    return (
      <div className="family-cards-container">
        {groupedByRelation.grandparents.length > 0 && (
          <div className="relation-group">
            <h4 className="relation-title">Grandparents</h4>
            <div className="card-row">
              {groupedByRelation.grandparents.map(member => (
                <div
                  key={member._id}
                  className="family-card grandparents"
                  onClick={() => handleCardClick(member)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5>{member.name}</h5>
                  <p><strong>Relation:</strong> {member.relation}</p>
                  <p><strong>Aadhar:</strong> {member.aadhar || 'N/A'}</p>
                  <p><strong>PAN:</strong> {member.pan || 'N/A'}</p>
                  <p><strong>Passport:</strong> {member.passport || 'N/A'}</p>
                  <p><strong>Voter ID:</strong> {member.voterId || 'N/A'}</p>
                  <p><strong>Driving License:</strong> {member.drivingLicense || 'N/A'}</p>
                  {member.fileUrl && (
                    <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {groupedByRelation.parents.length > 0 && (
          <div className="relation-group">
            <h4 className="relation-title">Parents</h4>
            <div className="card-row">
              {groupedByRelation.parents.map(member => (
                <div
                  key={member._id}
                  className="family-card parents"
                  onClick={() => handleCardClick(member)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5>{member.name}</h5>
                  <p><strong>Relation:</strong> {member.relation}</p>
                  <p><strong>Aadhar:</strong> {member.aadhar || 'N/A'}</p>
                  <p><strong>PAN:</strong> {member.pan || 'N/A'}</p>
                  <p><strong>Passport:</strong> {member.passport || 'N/A'}</p>
                  <p><strong>Voter ID:</strong> {member.voterId || 'N/A'}</p>
                  <p><strong>Driving License:</strong> {member.drivingLicense || 'N/A'}</p>
                  {member.fileUrl && (
                    <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {groupedByRelation.selfSpouse.length > 0 && (
          <div className="relation-group">
            <h4 className="relation-title">Self & Spouse</h4>
            <div className="card-row">
              {groupedByRelation.selfSpouse.map(member => (
                <div
                  key={member._id}
                  className="family-card selfSpouse"
                  onClick={() => handleCardClick(member)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5>{member.name}</h5>
                  <p><strong>Relation:</strong> {member.relation}</p>
                  <p><strong>Aadhar:</strong> {member.aadhar || 'N/A'}</p>
                  <p><strong>PAN:</strong> {member.pan || 'N/A'}</p>
                  <p><strong>Passport:</strong> {member.passport || 'N/A'}</p>
                  <p><strong>Voter ID:</strong> {member.voterId || 'N/A'}</p>
                  <p><strong>Driving License:</strong> {member.drivingLicense || 'N/A'}</p>
                  {member.fileUrl && (
                    <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {groupedByRelation.siblings.length > 0 && (
          <div className="relation-group">
            <h4 className="relation-title">Siblings</h4>
            <div className="card-row">
              {groupedByRelation.siblings.map(member => (
                <div
                  key={member._id}
                  className="family-card siblings"
                  onClick={() => handleCardClick(member)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5>{member.name}</h5>
                  <p><strong>Relation:</strong> {member.relation}</p>
                  <p><strong>Aadhar:</strong> {member.aadhar || 'N/A'}</p>
                  <p><strong>PAN:</strong> {member.pan || 'N/A'}</p>
                  <p><strong>Passport:</strong> {member.passport || 'N/A'}</p>
                  <p><strong>Voter ID:</strong> {member.voterId || 'N/A'}</p>
                  <p><strong>Driving License:</strong> {member.drivingLicense || 'N/A'}</p>
                  {member.fileUrl && (
                    <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
            {groupedByRelation.siblingsChildren.length > 0 && (
              <div className="children-row">
                <h4 className="relation-title">Siblings' Children</h4>
                <div className="card-row">
                  {groupedByRelation.siblingsChildren.map(member => (
                    <div
                      key={member._id}
                      className="family-card siblingsChildren"
                      onClick={() => handleCardClick(member)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h5>{member.name}</h5>
                      <p><strong>Relation:</strong> {member.relation}</p>
                      <p><strong>Aadhar:</strong> {member.aadhar || 'N/A'}</p>
                      <p><strong>PAN:</strong> {member.pan || 'N/A'}</p>
                      <p><strong>Passport:</strong> {member.passport || 'N/A'}</p>
                      <p><strong>Voter ID:</strong> {member.voterId || 'N/A'}</p>
                      <p><strong>Driving License:</strong> {member.drivingLicense || 'N/A'}</p>
                      {member.fileUrl && (
                        <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                          View Document
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {groupedByRelation.others.length > 0 && (
          <div className="relation-group">
            <h4 className="relation-title">Other Relations</h4>
            <div className="card-row">
              {groupedByRelation.others.map(member => (
                <div
                  key={member._id}
                  className="family-card others"
                  onClick={() => handleCardClick(member)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5>{member.name}</h5>
                  <p><strong>Relation:</strong> {member.relation}</p>
                  <p><strong>Aadhar:</strong> {member.aadhar || 'N/A'}</p>
                  <p><strong>PAN:</strong> {member.pan || 'N/A'}</p>
                  <p><strong>Passport:</strong> {member.passport || 'N/A'}</p>
                  <p><strong>Voter ID:</strong> {member.voterId || 'N/A'}</p>
                  <p><strong>Driving License:</strong> {member.drivingLicense || 'N/A'}</p>
                  {member.fileUrl && (
                    <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                      View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="main-content">
      <h2>Welcome {legalName}</h2>
      <h4>Your Family Tree</h4>
      {error && <p className="error">{error}</p>}
      {toastMessage && <div className="toast">{toastMessage}</div>}
      <div className="family-details">
        <h3>Family Details</h3>
        {familyCards.length > 0 ? renderFamilyCards() : <p>No family members registered.</p>}
      </div>
    </div>
  );
};

export default FamilyTree;