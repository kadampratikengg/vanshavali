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
import toast, { Toaster } from 'react-hot-toast';
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
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  // Listen for changes to localStorage token
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token') || '';
      setToken(newToken);
      if (!newToken) {
        setError('Authentication token missing. Please log in again.');
        setIsAuthenticated(false);
        navigate('/');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setIsAuthenticated, navigate, setError]);

  // Validate token presence on mount
  useEffect(() => {
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsAuthenticated(false);
      navigate('/');
    }
  }, [token, navigate, setError, setIsAuthenticated]);

  // Effect to handle toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error, {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
    }
    if (success) {
      toast.success(success, {
        style: {
          background: '#dcfce7',
          color: '#15803d',
        },
      });
    }
  }, [error, success]);

  const toggleSidebar = () => {
    setIsSidebarMinimized((prevState) => !prevState);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setToken('');
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
      <Toaster position="top-right" reverseOrder={false} />
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
          <AccountSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <IdentitySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <FinancialSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <PropertySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <MedicalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <EducationSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <DigitalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <LegacySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <FamilySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
        </div>
      </div>
    </div>
  );
};

export default Profile;