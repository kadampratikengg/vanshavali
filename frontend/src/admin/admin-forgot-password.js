import React, { useState } from 'react';
import '../components/LoginPage.css';
import toast, { Toaster } from 'react-hot-toast'; // Added react-hot-toast for consistency

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    setError('');
    setMessage('');

    try {
      // Send request to admin-specific forgot-password endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        toast.success(data.message, {
          style: {
            background: '#dcfce7',
            color: '#15803d',
          },
        });
      } else {
        setError(data.message);
        toast.error(data.message, {
          style: {
            background: '#fee2e2',
            color: '#b91c1c',
          },
        });
      }
    } catch (err) {
      const errorMsg = 'Server error. Please try again later.';
      setError(errorMsg);
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
    <div className='login-page'>
      <Toaster position="top-right" reverseOrder={false} />
      <form onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

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

        <button type='submit'>Send Reset Link</button>

        {message && <p className='message'>{message}</p>}
        {error && <p className='error'>{error}</p>}
      </form>
    </div>
  );
};

export default ForgotPasswordPage;