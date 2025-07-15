import React, { useState, useEffect } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AccountSection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [accountData, setAccountData] = useState({
    Username: '',
    Password: '',
    ResetPassword: '',
    ConfirmPassword: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          navigate('/'); // Redirect to login page
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/current`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { username } = response.data;
        setAccountData((prev) => ({
          ...prev,
          Username: username || '',
          Password: '********',
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.code === 'ERR_NETWORK') {
          setError('Cannot connect to the server. Please check if the backend is running.');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch user data');
        }
      }
    };

    fetchUserData();
  }, [setError, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (accountData.ResetPassword || accountData.ConfirmPassword) {
      if (accountData.ResetPassword !== accountData.ConfirmPassword) {
        setError('Reset Password and Confirm Password do not match');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          navigate('/'); // Redirect to login page
          return;
        }

        await axios.post(
          `${process.env.REACT_APP_API_URL}/reset-password`,
          {
            resetToken: token,
            newPassword: accountData.ResetPassword,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSuccess('Password reset successfully');
        setAccountData((prev) => ({
          ...prev,
          ResetPassword: '',
          ConfirmPassword: '',
          Password: '********',
        }));
      } catch (error) {
        console.error('Error resetting password:', error);
        if (error.code === 'ERR_NETWORK') {
          setError('Cannot connect to the server. Please check if the backend is running.');
        } else {
          setError(error.response?.data?.message || 'Failed to reset password');
        }
        return;
      }
    }

    console.log({ accountData });
    handleSubmit(e);
  };

  return (
    <form className="section account-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Account Information
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        <div className="form-grid">
          {Object.keys(accountData).map((key) => (
            <div key={key} className="form-row">
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').trim()}:</label>
                  <input
                    type={key.includes('Password') ? 'password' : 'text'}
                    id={key}
                    name={key}
                    value={accountData[key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={key === 'Username' || key === 'Password'}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};

export default AccountSection;