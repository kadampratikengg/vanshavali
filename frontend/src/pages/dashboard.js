import React, { useState, useEffect } from 'react';
import './dashboard.css';
import {
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBars,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Tree from 'react-d3-tree';
import axios from 'axios';
import IdentitySection from './IdentitySection';
import FamilySection from './FamilySection';

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [legalName, setLegalName] = useState('');
  const navigate = useNavigate();

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

        // Ensure unique family members by checking Aadhar, PAN, Passport
        const uniqueMembers = [];
        const seenIds = new Set();
        familyMembers.forEach(member => {
          const identifier = `${member.aadhar || ''}-${member.pan || ''}-${member.passport || ''}`;
          if (!seenIds.has(identifier) && member.name && member.relation !== 'Select Relation') {
            seenIds.add(identifier);
            uniqueMembers.push(member);
          }
        });

        // Build tree data with user as root
        const tree = {
          name: personalData?.LegalName || name || 'User',
          attributes: { relation: 'Self' },
          children: uniqueMembers.map(member => ({
            name: member.name,
            attributes: { relation: member.relation },
            children: [], // Placeholder for future hierarchy
          })),
        };
        setTreeData(tree);
      } catch (error) {
        console.error('Fetch data error:', error);
        setError(error.response?.data?.message || 'Failed to fetch family data');
      }
    };
    fetchData();
  }, [token, userId, name]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const toggleSidebar = () => {
    setIsSidebarMinimized(prevState => !prevState);
  };

  // Custom node rendering for family tree
  const renderCustomNode = ({ nodeDatum, toggleNode }) => (
    <g>
      <rect
        width="150"
        height="60"
        x="-75"
        y="-30"
        rx="10"
        fill="#f0f4f8"
        stroke="#4a90e2"
        strokeWidth="2"
        onClick={toggleNode}
        style={{ cursor: 'pointer' }}
      />
      <text fill="#333" x="-65" y="-10" fontSize="14">
        {nodeDatum.name}
      </text>
      <text fill="#888" x="40" y="-15" fontSize="12">
        {nodeDatum.attributes?.relation}
      </text>
    </g>
  );

  return (
    <div className="dashboard">
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : 'open'}`}>
        <button className="minimize-btn" onClick={toggleSidebar}>
          {isSidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        <ul>
          <li>
            <button onClick={() => navigate('/dashboard')}>
              <FaTachometerAlt size={20} />
              {!isSidebarMinimized && 'Dashboard'}
            </button>
          </li>
          <li className="sidebar-bottom">
            <button onClick={handleProfile}>
              <FaUser size={20} />
              {!isSidebarMinimized && 'Profile'}
            </button>
          </li>
          <li>
            <button onClick={handleSettings}>
              <FaCog size={20} />
              {!isSidebarMinimized && 'Settings'}
            </button>
          </li>
          <li>
            <button onClick={handleLogout}>
              <FaSignOutAlt size={20} />
              {!isSidebarMinimized && 'Log Out'}
            </button>
          </li>
        </ul>
      </div>

      <div className={`content ${isSidebarMinimized ? '' : 'shifted'}`}>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <FaBars size={24} />
        </button>
        <div className="main-content">
          <h2>Welcome, {legalName}</h2>
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
          <div className="family-tree-container" style={{ width: '100%', height: '600px' }}>
            <h3>Your Family Tree</h3>
            {treeData ? (
              <Tree
                data={treeData}
                orientation="vertical"
                translate={{ x: 400, y: 100 }}
                zoom={0.8}
                nodeSize={{ x: 200, y: 100 }}
                renderCustomNodeElement={renderCustomNode}
                pathFunc="diagonal"
                collapsible={true}
                onNodeClick={(node, event) => {
                  if (node.children || node._children) {
                    node._children = node._children ? null : node.children;
                    node.children = node._children ? null : node.children;
                    setTreeData({ ...treeData });
                  }
                }}
              />
            ) : (
              <p>Loading family tree...</p>
            )}
          </div>
          <IdentitySection setError={setError} setSuccess={setSuccess} userId={userId} token={token} />
          <FamilySection setError={setError} setSuccess={setSuccess} userId={userId} token={token} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;