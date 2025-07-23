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
import FamilyTree from './FamilyTree';

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
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
        <div >
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
          <FamilyTree setError={setError} setSuccess={setSuccess} userId={userId} token={token} name={name} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;