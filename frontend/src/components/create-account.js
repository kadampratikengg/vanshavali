import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { displayRazorpay } from './RazorpayPayment';
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
      toast.error('Please enter a valid email address.');
      return;
    }

    setEmailError('');

    // Password and confirm password validation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    setPasswordError('');
    setErrorMessage('');
    setLoading(true);

    try {
      // Validate required fields for create-order
      const amount = Number(process.env.REACT_APP_PAYMENT_AMOUNT);
      if (!amount || isNaN(amount)) {
        setErrorMessage('Payment amount is not configured.');
        toast.error('Payment amount is not configured.');
        setLoading(false);
        return;
      }
      if (!email) {
        setErrorMessage('Email is required for payment.');
        toast.error('Email is required for payment.');
        setLoading(false);
        return;
      }
      const currency = 'INR';
      if (!currency) {
        setErrorMessage('Currency is not configured.');
        toast.error('Currency is not configured.');
        setLoading(false);
        return;
      }

      // Create Razorpay order
      const orderResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/create-order`,
        { amount, currency, email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      await displayRazorpay({
        amount,
        email,
        order_id: orderResponse.data.order_id,
        description: 'Account Creation Payment',
        onSuccess: async (paymentResponse) => {
          try {
            const response = await axios.post(
              `${process.env.REACT_APP_API_URL}/create-account`,
              {
                email,
                password,
                confirmPassword,
                payment_id: paymentResponse.razorpay_payment_id,
                order_id: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.data.message === 'Account created successfully') {
              localStorage.setItem('token', response.data.token);
              localStorage.setItem('userId', response.data.userId);
              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('validity', response.data.validity);
              toast.success('Account created successfully!');
              navigate('/');
            }
          } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Account creation failed.');
            toast.error(error.response?.data?.message || 'Account creation failed.');
            setLoading(false);
          }
        },
        onFailure: (error) => {
          setErrorMessage(error || 'Payment failed.');
          toast.error(error || 'Payment failed.');
          setLoading(false);
        },
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create order.');
      toast.error(error.response?.data?.message || 'Failed to create order.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Toaster position="top-right" reverseOrder={false} />
      <form onSubmit={handleSubmit}>
        <h2>Create New Account</h2>

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

        <div className="input-field">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && <p className="error">{passwordError}</p>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Create Account'}
        </button>

        {errorMessage && <p className="error">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default CreateAccountPage;