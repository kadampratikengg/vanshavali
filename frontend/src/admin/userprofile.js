import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBars,
} from 'react-icons/fa';
import '../pages/dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAuthenticated');
    // Navigate to admin login with replace to clear history
    navigate('/admin', { replace: true });
  };

  const handleProfile = () => {
    navigate('/admin/userprofile');
  };

  const handleSettings = () => {
    navigate('/admin/usersettings');
  };

  const toggleSidebar = () => {
    setIsSidebarMinimized(prevState => !prevState);
  };

  return (
    <div className="dashboard">
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : 'open'}`}>
        <button className="minimize-btn" onClick={toggleSidebar}>
          {isSidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        <ul>
          <li>
            <button onClick={() => navigate('/admin/dashboard')}>
              <FaTachometerAlt size={20} />
              {!isSidebarMinimized && <span>Admin Dashboard</span>}
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
          <h2>All Profiles</h2>
          <p>Welcome to the Admin Dashboard!</p>
          <div className="section">
            <h3>Admin Overview</h3>
            <div className="section-content expanded">
              <p>Manage users, settings, and system configurations from this dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;