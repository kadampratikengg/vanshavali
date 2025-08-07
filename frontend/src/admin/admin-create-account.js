import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const CreateAccountPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.', {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
      return;
    }

    setEmailError('');

    // Password and confirm password validation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      toast.error('Passwords do not match.', {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
      return;
    }

    setPasswordError('');
    setErrorMessage('');

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/create-account`,
        { email, password, confirmPassword },
        { withCredentials: true }
      );

      if (response.data.message === 'Account created successfully') {
        // Store token and userId in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('isAuthenticated', 'true');
        toast.success('Account created successfully! Please log in.', {
          style: {
            background: '#dcfce7',
            color: '#15803d',
          },
        });
        navigate('/admin', { replace: true }); // Redirect to admin login page
      }
    } catch (error) {
      const errorMsg = error.response
        ? error.response.data.message || 'Something went wrong'
        : error.request
        ? 'No response from the server.'
        : 'Request failed: ' + error.message;
      setErrorMessage(errorMsg);
      toast.error(errorMsg, {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <Toaster position="top-right" reverseOrder={false} />
      <form onSubmit={handleSubmit}>
        <h2>Create Admin Account</h2>

        <div className='input-field'>
          <label>Email</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailError && <p className='error'>{emailError}</p>}
        </div>

        <div className='input-field'>
          <label>Password</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className='input-field'>
          <label>Confirm Password</label>
          <input
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && <p className='error'>{passwordError}</p>}
        </div>

        <button type='submit' disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {errorMessage && <p className='error'>{errorMessage}</p>}
      </form>
    </div>
  );
};

export default CreateAccountPage;