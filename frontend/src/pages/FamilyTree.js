import React, { useState, useEffect, useMemo } from 'react';
import './FamilyTree.css';
import Tree from 'react-d3-tree';
import axios from 'axios';

const FamilyTree = ({ setIsAuthenticated, name }) => {
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [familyCards, setFamilyCards] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [legalName, setLegalName] = useState('');

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

        // Fetch Identity Data for Legal Name
        const identityResponse = await axios.get(`${process.env.REACT_APP_API_URL}/identity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { personalData } = identityResponse.data;
        setLegalName(personalData?.LegalName || name || 'User');

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

        // Set initial family cards for the logged-in user
        setFamilyCards(uniqueMembers);

        // Build stage-wise hierarchical tree
        const buildTree = (rootMember, members, isRootUser = true) => {
          const rootNode = {
            id: rootMember?.id || userId,
            name: rootMember?.name || personalData?.LegalName || name || 'User',
            attributes: { relation: isRootUser ? 'Self' : rootMember?.relation || 'Unknown', level: 'selfSpouse' },
            children: [],
          };

          // Stage 1: Grandparents
          const grandparents = members.filter(m => ['grandfather', 'grandmother'].includes(m.relation.toLowerCase()));
          const grandparentNode = {
            name: 'Grandparents',
            attributes: { relation: '', level: 'grandparents' },
            children: grandparents.map(g => ({
              id: g._id,
              name: g.name,
              attributes: { relation: g.relation, level: 'grandparents' },
              children: [],
            })),
          };

          // Stage 2: Parents
          const parents = members.filter(m => ['father', 'mother'].includes(m.relation.toLowerCase()));
          const parentNode = {
            name: 'Parents',
            attributes: { relation: '', level: 'parents' },
            children: parents.map(p => ({
              id: p._id,
              name: p.name,
              attributes: { relation: p.relation, level: 'parents' },
              children: [],
            })),
          };

          // Stage 3: Self and Spouse
          const spouses = members.filter(m => m.relation.toLowerCase() === 'spouse');
          const selfSpouseNode = {
            name: 'Self & Spouse',
            attributes: { relation: '', level: 'selfSpouse' },
            children: [
              ...(isRootUser ? [rootNode] : []),
              ...spouses.map(s => ({
                id: s._id,
                name: s.name,
                attributes: { relation: s.relation, level: 'selfSpouse' },
                children: [],
              })),
            ],
          };

          // Stage 4: Siblings
          const siblings = members.filter(m => ['brother', 'sister'].includes(m.relation.toLowerCase()));
          const siblingNode = {
            name: 'Siblings',
            attributes: { relation: '', level: 'siblings' },
            children: siblings.map(s => ({
              id: s._id,
              name: s.name,
              attributes: { relation: s.relation, level: 'siblings' },
              children: [],
            })),
          };

          // Stage 5: Siblings' Children
          const siblingsChildren = members.filter(m => ['son', 'daughter'].includes(m.relation.toLowerCase()) && siblings.some(s => s._id === m.parentId));
          const siblingsChildrenNode = {
            name: 'Siblings\' Children',
            attributes: { relation: '', level: 'siblingsChildren' },
            children: siblingsChildren.map(c => ({
              id: c._id,
              name: c.name,
              attributes: { relation: c.relation, level: 'siblingsChildren' },
              children: [],
            })),
          };

          // Stage 6: Other Relations
          const others = members.filter(m => !['grandfather', 'grandmother', 'father', 'mother', 'spouse', 'brother', 'sister', 'son', 'daughter'].includes(m.relation.toLowerCase()));
          const otherNode = {
            name: 'Other Relations',
            attributes: { relation: '', level: 'others' },
            children: others.map(o => ({
              id: o._id,
              name: o.name,
              attributes: { relation: o.relation, level: 'others' },
              children: [],
            })),
          };

          // Construct tree
          if (grandparents.length > 0) {
            grandparentNode.children.push(parentNode);
            if (parents.length > 0) {
              parentNode.children.push(selfSpouseNode);
              if (spouses.length > 0 || isRootUser) {
                selfSpouseNode.children.push(siblingNode);
                if (siblings.length > 0) {
                  siblingNode.children.push(siblingsChildrenNode);
                }
                selfSpouseNode.children.push(otherNode);
              } else {
                parentNode.children.push(siblingNode, siblingsChildrenNode, otherNode);
              }
            } else {
              grandparentNode.children.push(selfSpouseNode, siblingNode, siblingsChildrenNode, otherNode);
            }
            return grandparentNode;
          } else if (parents.length > 0) {
            parentNode.children.push(selfSpouseNode, siblingNode, siblingsChildrenNode, otherNode);
            return parentNode;
          } else {
            selfSpouseNode.children.push(siblingNode, siblingsChildrenNode, otherNode);
            return selfSpouseNode;
          }
        };

        setTreeData(buildTree(null, uniqueMembers));
      } catch (error) {
        console.error('Fetch data error:', error);
        setError(error.response?.data?.message || 'Failed to fetch family data');
      }
    };
    fetchData();
  }, [token, userId, name, relationOptions]);

  const handleNodeClick = async (node) => {
    if (!node.id || node.id === userId) {
      // Reset to logged-in user's family
      const familyResponse = await axios.get(`${process.env.REACT_APP_API_URL}/family`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { familyMembers } = familyResponse.data;
      const uniqueMembers = [];
      const seenIds = new Set();
      familyMembers.forEach(member => {
        const identifier = `${member.aadhar || ''}-${member.pan || ''}-${member.passport || ''}`;
        if (!seenIds.has(identifier) && member.name && relationOptions.includes(member.relation)) {
          seenIds.add(identifier);
          uniqueMembers.push(member);
        }
      });
      setFamilyCards(uniqueMembers);
      setSelectedMember(null);
      setLegalName(name || 'User');
      setToastMessage('Reset to your family tree');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    try {
      // Fetch family data for the clicked person
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/family/${node.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { familyMembers } = response.data;

      const uniqueMembers = [];
      const seenIds = new Set();
      familyMembers.forEach(member => {
        const identifier = `${member.aadhar || ''}-${member.pan || ''}-${member.passport || ''}`;
        if (!seenIds.has(identifier) && member.name && relationOptions.includes(member.relation)) {
          seenIds.add(identifier);
          uniqueMembers.push(member);
        }
      });

      const buildTree = (rootMember, members) => {
        const rootNode = {
          id: rootMember._id,
          name: rootMember.name,
          attributes: { relation: 'Self', level: 'selfSpouse' },
          children: [],
        };

        const grandparents = members.filter(m => ['grandfather', 'grandmother'].includes(m.relation.toLowerCase()));
        const grandparentNode = {
          name: 'Grandparents',
          attributes: { relation: '', level: 'grandparents' },
          children: grandparents.map(g => ({
            id: g._id,
            name: g.name,
            attributes: { relation: g.relation, level: 'grandparents' },
            children: [],
          })),
        };

        const parents = members.filter(m => ['father', 'mother'].includes(m.relation.toLowerCase()));
        const parentNode = {
          name: 'Parents',
          attributes: { relation: '', level: 'parents' },
          children: parents.map(p => ({
            id: p._id,
            name: p.name,
            attributes: { relation: p.relation, level: 'parents' },
            children: [],
          })),
        };

        const spouses = members.filter(m => m.relation.toLowerCase() === 'spouse');
        const selfSpouseNode = {
          name: 'Self & Spouse',
          attributes: { relation: '', level: 'selfSpouse' },
          children: [
            rootNode,
            ...spouses.map(s => ({
              id: s._id,
              name: s.name,
              attributes: { relation: s.relation, level: 'selfSpouse' },
              children: [],
            })),
          ],
        };

        const siblings = members.filter(m => ['brother', 'sister'].includes(m.relation.toLowerCase()));
        const siblingNode = {
          name: 'Siblings',
          attributes: { relation: '', level: 'siblings' },
          children: siblings.map(s => ({
            id: s._id,
            name: s.name,
            attributes: { relation: s.relation, level: 'siblings' },
            children: [],
          })),
        };

        const siblingsChildren = members.filter(m => ['son', 'daughter'].includes(m.relation.toLowerCase()) && siblings.some(s => s._id === m.parentId));
        const siblingsChildrenNode = {
          name: 'Siblings\' Children',
          attributes: { relation: '', level: 'siblingsChildren' },
          children: siblingsChildren.map(c => ({
            id: c._id,
            name: c.name,
            attributes: { relation: c.relation, level: 'siblingsChildren' },
            children: [],
          })),
        };

        const others = members.filter(m => !['grandfather', 'grandmother', 'father', 'mother', 'spouse', 'brother', 'sister', 'son', 'daughter'].includes(m.relation.toLowerCase()));
        const otherNode = {
          name: 'Other Relations',
          attributes: { relation: '', level: 'others' },
          children: others.map(o => ({
            id: o._id,
            name: o.name,
            attributes: { relation: o.relation, level: 'others' },
            children: [],
          })),
        };

        if (grandparents.length > 0) {
          grandparentNode.children.push(parentNode);
          if (parents.length > 0) {
            parentNode.children.push(selfSpouseNode);
            selfSpouseNode.children.push(siblingNode, siblingsChildrenNode, otherNode);
          } else {
            grandparentNode.children.push(selfSpouseNode, siblingNode, siblingsChildrenNode, otherNode);
          }
          return grandparentNode;
        } else if (parents.length > 0) {
          parentNode.children.push(selfSpouseNode, siblingNode, siblingsChildrenNode, otherNode);
          return parentNode;
        } else {
          selfSpouseNode.children.push(siblingNode, siblingsChildrenNode, otherNode);
          return selfSpouseNode;
        }
      };

      setTreeData(buildTree({ _id: node.id, name: node.name }, uniqueMembers));
      setFamilyCards(uniqueMembers);
      setSelectedMember(node.name);
      setLegalName(node.name);
      setToastMessage(`Selected ${node.name}'s family tree`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (error) {
      console.error('Fetch node family error:', error);
      setError(error.response?.data?.message || 'Failed to fetch family data for this person');
      setToastMessage('Error fetching family data');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Custom node rendering for family tree
  const renderCustomNode = ({ nodeDatum, toggleNode }) => {
    if (!nodeDatum.children || nodeDatum.children.length === 0) {
      // Render individual member card for leaf nodes
      const nameLength = nodeDatum.name ? nodeDatum.name.length : 0;
      const baseWidth = 200;
      const charWidth = 18;
      const padding = 30;
      const cardWidth = Math.max(baseWidth, nameLength * charWidth + padding);
      const cardHeight = 70;

      return (
        <g onClick={() => { toggleNode(); handleNodeClick(nodeDatum); }}>
          <rect
            width={cardWidth}
            height={cardHeight}
            x={-cardWidth / 2}
            y={-cardHeight / 2}
            rx="8"
            ry="8"
            className={`node-card ${nodeDatum.attributes?.level || ''}`}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
          />
          <text
            x="0"
            y="5"
            fontSize="28"
            fontWeight="400"
            textAnchor="middle"
            dominantBaseline="middle"
            className="node-text"
          >
            {nodeDatum.name}
          </text>
          {nodeDatum.attributes?.relation && (
            <text
              x={(cardWidth / 2) - 12}
              y={-cardHeight / 2 + 20}
              fontSize="14"
              fontWeight="400"
              textAnchor="end"
              className="node-text"
            >
              {nodeDatum.attributes.relation}
            </text>
          )}
        </g>
      );
    }

    // Render row-based layout for parent nodes (e.g., Grandparents, Parents, etc.)
    const members = nodeDatum.children.map(child => ({
      id: child.id,
      name: child.name,
      relation: child.attributes?.relation || '',
      level: child.attributes?.level || nodeDatum.attributes?.level || '',
    }));

    const cardWidth = 250;
    const cardHeight = 120;
    const gap = 20;
    const totalWidth = members.length * (cardWidth + gap) - gap;

    return (
      <g className="node-row" onClick={() => toggleNode()}>
        {members.map((member, index) => (
          <g
            key={member.id || index}
            transform={`translate(${(index * (cardWidth + gap)) - (totalWidth / 2)}, 0)`}
            onClick={(e) => { e.stopPropagation(); handleNodeClick(member); }}
          >
            <rect
              width={cardWidth}
              height={cardHeight}
              x={-cardWidth / 2}
              y={-cardHeight / 2}
              rx="8"
              ry="8"
              className={`node-card ${member.level}`}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
            />
            <text
              x="0"
              y="-20"
              fontSize="20"
              fontWeight="600"
              textAnchor="middle"
              className="node-text"
            >
              {member.name}
            </text>
            <text
              x="0"
              y="10"
              fontSize="14"
              fontWeight="400"
              textAnchor="middle"
              className="node-text"
            >
              {member.relation}
            </text>
          </g>
        ))}
      </g>
    );
  };

  // Render family members as cards
  const renderFamilyCards = () => {
    const groupedByRelation = {
      grandparents: familyCards.filter(m => ['grandfather', 'grandmother'].includes(m.relation.toLowerCase())),
      parents: familyCards.filter(m => ['father', 'mother'].includes(m.relation.toLowerCase())),
      selfSpouse: [
        ...familyCards.filter(m => m.relation.toLowerCase() === 'spouse'),
        ...(userId ? [{ _id: userId, name: legalName, relation: 'Self' }] : []),
      ],
      siblings: familyCards.filter(m => ['brother', 'sister'].includes(m.relation.toLowerCase())),
      siblingsChildren: familyCards.filter(m => ['son', 'daughter'].includes(m.relation.toLowerCase()) && familyCards.some(s => ['brother', 'sister'].includes(s.relation.toLowerCase()) && s._id === m.parentId)),
      others: familyCards.filter(m => !['grandfather', 'grandmother', 'father', 'mother', 'spouse', 'brother', 'sister', 'son', 'daughter'].includes(m.relation.toLowerCase())),
    };

    return (
      <div className="family-cards-container">
        {groupedByRelation.grandparents.length > 0 && (
          <div className="relation-group">
            <h4 className="relation-title">Grandparents</h4>
            <div className="card-row">
              {groupedByRelation.grandparents.map(member => (
                <div key={member._id} className="family-card grandparents">
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
                <div key={member._id} className="family-card parents">
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
                <div key={member._id} className="family-card selfSpouse">
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
                <div key={member._id} className="family-card siblings">
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
                    <div key={member._id} className="family-card">
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
                <div key={member._id} className="family-card others">
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
      <h2>Welcome {selectedMember || legalName}</h2>
      <h4>Your Family Tree {selectedMember || legalName}</h4>
      {error && <p className="error">{error}</p>}
      {toastMessage && <div className="toast">{toastMessage}</div>}
      <div className="family-details" style={{ width: '100%', height: '600px' }}>
        {treeData ? (
          <Tree
            data={treeData}
            orientation="vertical"
            translate={{ x: 600, y: 150 }}
            zoom={0.6}
            nodeSize={{ x: 800, y: 200 }}
            renderCustomNodeElement={renderCustomNode}
            pathFunc="diagonal"
            collapsible={true}
            separation={{ siblings: 1, nonSiblings: 2 }}
          />
        ) : (
          <p>Loading family tree...</p>
        )}
      </div>
      <div className="family-details">
        <h3>Family Details</h3>
        {familyCards.length > 0 ? renderFamilyCards() : <p>No family members registered.</p>}
      </div>
    </div>
  );
};

export default FamilyTree;