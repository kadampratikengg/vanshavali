import React, { useState } from 'react';
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
import AccountSection from './AccountSection';
import IdentitySection from './IdentitySection';
import FinancialSection from './FinancialSection';
import PropertySection from './PropertySection';
import MedicalSection from './MedicalSection';
import EducationSection from './EducationSection';
import DigitalSection from './DigitalSection';
import LegacySection from './LegacySection';
import FamilySection from './FamilySection';

const Profile = ({ setIsAuthenticated, name }) => {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarMinimized((prevState) => !prevState);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Section-specific submissions are handled in respective components
  };

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
              {!isSidebarMinimized && <span>Dashboard</span>}
            </button>
          </li>
          <li className="sidebar-bottom">
            <button onClick={handleProfile}>
              <FaUser size={20} />
              {!isSidebarMinimized && <span>Profile</span>}
            </button>
          </li>
          <li>
            <button onClick={handleSettings}>
              <FaCog size={20} />
              {!isSidebarMinimized && <span>Settings</span>}
            </button>
          </li>
          <li>
            <button onClick={handleLogout}>
              <FaSignOutAlt size={20} />
              {!isSidebarMinimized && <span>Log Out</span>}
            </button>
          </li>
        </ul>
      </div>

      <div className={`content ${isSidebarMinimized ? '' : 'shifted'}`}>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <FaBars size={24} />
        </button>
        <div className="main-content">
          <h2>User Profile</h2>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-2">{success}</p>}

          <AccountSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <IdentitySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <FinancialSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <PropertySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <MedicalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <EducationSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <DigitalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <LegacySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />
          <FamilySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />

          <div className="submit-section">
            <button
              type="submit"
              onClick={handleSubmit}
              className="submit-section"
            >
              Submit All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;