import React, { useState } from 'react';
import './LoginPage.css';
import toast, { Toaster } from 'react-hot-toast';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Check if email matches the regex pattern
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

    // Clear the error if email is valid
    setEmailError('');
    setErrorMessage('');

    try {
      // Send POST request to /login for user login
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and userId in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('isAuthenticated', 'true');
        // Show success toast
        toast.success('Login successful!', {
          style: {
            background: '#dcfce7',
            color: '#15803d',
          },
        });
        // Call onLogin callback
        onLogin();
      } else {
        setErrorMessage(data.message);
        toast.error(data.message, {
          style: {
            background: '#fee2e2',
            color: '#b91c1c',
          },
        });
      }
    } catch (err) {
      const errorMsg = 'An error occurred while logging in';
      setErrorMessage(errorMsg);
      toast.error(errorMsg, {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <Toaster position="top-right" reverseOrder={false} />
      <form onSubmit={handleSubmit}>
        <h2>Login to A M</h2>

        <div className="input-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailError && <p className="error">{emailError}</p>}
        </div>

        <div className="input-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Login</button>

        {errorMessage && <p className="error">{errorMessage}</p>}

        <div className="links">
          <a href="/forgot-password">Forgot Password?</a>
          <br /><br />
          <a href="/create-account">Create New Account</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;