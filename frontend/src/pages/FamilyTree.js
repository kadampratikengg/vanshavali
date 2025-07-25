import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
                alternateName: 'N/A',
                dateOfBirth: 'N/A',
                placeOfBirth: 'N/A',
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

  const handleFamilyTreeClick = (member) => {
    navigate(`/family-tree/${member._id}`, {
      state: {
        member: {
          _id: member._id,
          name: member.name,
          relation: member.relation,
        },
      },
    });
    setToastMessage(`Viewing family tree for ${member.name}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Define generations and their relations
  const renderFamilyCards = () => {
    const groupedByGeneration = {
      greatGrandparents: familyCards.filter(m => ['Great-grandfather', 'Great-grandmother'].includes(m.relation)),
      grandparents: familyCards.filter(m => ['Grandfather', 'Grandmother'].includes(m.relation)),
      parents: familyCards.filter(m => ['Father', 'Mother', 'Father-in-law', 'Mother-in-law'].includes(m.relation)),
      selfGeneration: familyCards.filter(m => ['Self', 'Spouse', 'Brother', 'Sister', 'Brother-in-law', 'Sister-in-law'].includes(m.relation)),
      children: familyCards.filter(m => ['Son', 'Daughter'].includes(m.relation)),
      grandchildren: familyCards.filter(m => ['Grandson', 'Granddaughter'].includes(m.relation)),
      extendedFamily: familyCards.filter(m => ['Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin'].includes(m.relation)),
      others: familyCards.filter(m => m.relation === 'Other'),
    };

    // Define CSS classes for each generation
    const generationClasses = {
      greatGrandparents: 'great-grandparents',
      grandparents: 'grandparents',
      parents: 'parents',
      selfGeneration: 'selfSpouse',
      children: 'children',
      grandchildren: 'grandchildren',
      extendedFamily: 'extendedFamily',
      others: 'others',
    };

    const renderGroup = (group, title, className) => (
      group.length > 0 && (
        <div className="relation-group">
          <h4 className="relation-title">{title}</h4>
          <div className="card-row">
            {group.map(member => (
              <div
                key={member._id}
                className={`family-card ${className}`}
                style={{ cursor: 'default' }}
              >
                <h5>{member.name}</h5>
                <p><strong>Relation:</strong> {member.relation}</p>
                {/* <p><strong>Aadhar:</strong> {member.aadhar || 'N/A'}</p>
                <p><strong>PAN:</strong> {member.pan || 'N/A'}</p>
                <p><strong>Passport:</strong> {member.passport || 'N/A'}</p>
                <p><strong>Voter ID:</strong> {member.voterId || 'N/A'}</p>
                <p><strong>Driving License:</strong> {member.drivingLicense || 'N/A'}</p> */}
                <br></br>
                <div className="flex flex-row gap-2 mt-2">
                  <button
                    onClick={() => handleCardClick(member)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleFamilyTreeClick(member)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                  >
                    View Family
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    );

    return (
      <div className="family-cards-container">
        {renderGroup(groupedByGeneration.greatGrandparents, 'Great-Grandparents', generationClasses.greatGrandparents)}
        {renderGroup(groupedByGeneration.grandparents, 'Grandparents', generationClasses.grandparents)}
        {renderGroup(groupedByGeneration.parents, 'Parents & In-Laws', generationClasses.parents)}
        {renderGroup(groupedByGeneration.selfGeneration, 'Self, Spouse & Siblings', generationClasses.selfGeneration)}
        {renderGroup(groupedByGeneration.children, 'Children', generationClasses.children)}
        {renderGroup(groupedByGeneration.grandchildren, 'Grandchildren', generationClasses.grandchildren)}
        {renderGroup(groupedByGeneration.extendedFamily, 'Extended Family', generationClasses.extendedFamily)}
        {renderGroup(groupedByGeneration.others, 'Other Relations', generationClasses.others)}
      </div>
    );
  };

  return (
    <div className="main-content">
      <h1>Hi, {legalName}</h1>
      <h5>Family Details of {legalName}</h5>
      {error && <p className="error">{error}</p>}
      {toastMessage && <div className="toast">{toastMessage}</div>}
      <div className="family-details">
        {familyCards.length > 0 ? renderFamilyCards() : <p>No family members registered.</p>}
      </div>
    </div>
  );
};

export default FamilyTree;