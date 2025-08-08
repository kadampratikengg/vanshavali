import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaTimes,
} from 'react-icons/fa';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './dashboard.css';

const UserSettings = () => {
  const navigate = useNavigate();
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        navigate('/admin');
        return;
      }
      console.log('Fetching users from:', `${process.env.REACT_APP_API_URL}/admin/users`);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
      if (response.data.length === 0) {
        setError('No users found in the database.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 404) {
        setError('Users endpoint not found. Please check if the backend server has a /admin/users route configured at ' + process.env.REACT_APP_API_URL);
      } else if (error.response?.status === 403) {
        setError('Access denied. Please ensure you have admin privileges.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check if the backend is running on localhost:5000.');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch users');
      }
      toast.error(error.response?.data?.message || 'Failed to fetch users', {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
    }
  }, [navigate, setError]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/admin', { replace: true });
    } else {
      fetchUsers();
    }
  }, [navigate, fetchUsers]);

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        navigate('/admin');
        return;
      }
      await axios.delete(`${process.env.REACT_APP_API_URL}/admin/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess('User deleted successfully');
      toast.success('User deleted successfully', {
        style: {
          background: '#dcfce7',
          color: '#15803d',
        },
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check if the backend is running.');
      } else {
        setError(error.response?.data?.message || 'Failed to delete user');
      }
      toast.error(error.response?.data?.message || 'Failed to delete user', {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
    }
  };

  const handleEditUser = (user) => {
    setEditingRow(user.id);
    setEditForm({ ...user });
  };

  const handleSaveEdit = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        navigate('/admin');
        return;
      }
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/user/${userId}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess('User updated successfully');
      toast.success('User updated successfully', {
        style: {
          background: '#dcfce7',
          color: '#15803d',
        },
      });
      setEditingRow(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
      toast.error(error.response?.data?.message || 'Failed to update user', {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditForm({});
  };

  const handleInputChange = (e, field) => {
    setEditForm({ ...editForm, [field]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAuthenticated');
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

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const getTableHeaders = () => {
    const fixedHeaders = ['Username', 'Password', 'Current Password', 'Reset Password', 'Reset Password Expires'];
    if (users.length > 0) {
      const additionalFields = Object.keys(users[0]).filter(
        (key) => !['id', 'email', 'token'].includes(key)
      );
      return [...fixedHeaders, ...additionalFields, 'Actions'];
    }
    return [...fixedHeaders, 'Actions'];
  };

  const formatFieldValue = (value, field, userId) => {
    if (field.toLowerCase().includes('password') && !showPasswords[userId]) {
      return '********';
    }
    if (field.toLowerCase() === 'resetpassword' || field.toLowerCase() === 'resetpasswordexpires') {
      return value || 'N/A';
    }
    return value || 'N/A';
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
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <div className="section">
            <h3>User Management</h3>
            <div className="section-content expanded table-scroll">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    {getTableHeaders().map((header) => (
                      <th key={header} className="border p-2 text-left">
                        {header.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-100">
                      {editingRow === user.id ? (
                        <>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={editForm.email || ''}
                              onChange={(e) => handleInputChange(e, 'email')}
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="border p-2 flex items-center">
                            <input
                              type={showPasswords[user.id] ? 'text' : 'password'}
                              value={editForm.password || ''}
                              onChange={(e) => handleInputChange(e, 'password')}
                              className="w-full p-1 border rounded"
                            />
                            <button
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="ml-2 text-gray-500 hover:text-gray-700"
                              title={showPasswords[user.id] ? 'Hide Password' : 'Show Password'}
                            >
                              {showPasswords[user.id] ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={editForm.currentPassword || ''}
                              onChange={(e) => handleInputChange(e, 'currentPassword')}
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={editForm.resetPassword || ''}
                              onChange={(e) => handleInputChange(e, 'resetPassword')}
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={editForm.resetPasswordExpires || ''}
                              onChange={(e) => handleInputChange(e, 'resetPasswordExpires')}
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          {Object.keys(user)
                            .filter((key) => !['id', 'email', 'token'].includes(key))
                            .map((key) => (
                              <td key={key} className="border p-2">
                                <input
                                  type="text"
                                  value={editForm[key] || ''}
                                  onChange={(e) => handleInputChange(e, key)}
                                  className="w-full p-1 border rounded"
                                />
                              </td>
                            ))}
                          <td className="border p-2 flex justify-center space-x-2">
                            <button
                              onClick={() => handleSaveEdit(user.id)}
                              className="text-green-500 hover:text-green-700 bg-transparent"
                              title="Save"
                            >
                              <FaSave size={20} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700 bg-transparent"
                              title="Cancel"
                            >
                              <FaTimes size={20} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="border p-2">{user.email || 'N/A'}</td>
                          <td className="border p-2 flex items-center">
                            {formatFieldValue(user.password, 'password', user.id)}
                            <button
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="ml-2 text-gray-500 hover:text-gray-700"
                              title={showPasswords[user.id] ? 'Hide Password' : 'Show Password'}
                            >
                              {showPasswords[user.id] ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                          </td>
                          <td className="border p-2">{formatFieldValue(null, 'currentPassword', user.id)}</td>
                          <td className="border p-2">{formatFieldValue(user.resetPassword, 'resetPassword', user.id)}</td>
                          <td className="border p-2">{formatFieldValue(user.resetPasswordExpires, 'resetPasswordExpires', user.id)}</td>
                          {Object.keys(user)
                            .filter((key) => !['id', 'email', 'token'].includes(key))
                            .map((key) => (
                              <td key={key} className="border p-2">
                                {formatFieldValue(user[key], key, user.id)}
                              </td>
                            ))}
                          <td className="border p-2 flex justify-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-500 hover:text-blue-700 bg-transparent"
                              title="Edit User"
                            >
                              <FaEdit size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-500 hover:text-red-700 bg-transparent"
                              title="Delete User"
                            >
                              <FaTrash size={20} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;