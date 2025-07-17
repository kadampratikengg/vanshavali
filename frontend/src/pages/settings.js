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

const Profile = ({ setIsAuthenticated, name }) => {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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
          <AccountSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} />

        </div>
      </div>
    </div>
  );
};

export default Profile;