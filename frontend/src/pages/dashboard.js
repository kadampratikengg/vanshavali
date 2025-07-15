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

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const navigate = useNavigate();

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
    setIsSidebarMinimized((prevState) => !prevState);
  };

  return (
    <div className='dashboard'>
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : 'open'}`}>
        <button className='minimize-btn' onClick={toggleSidebar}>
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
        <div className='main-content'>
          <h2>Welcome to the Dashboard</h2>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;