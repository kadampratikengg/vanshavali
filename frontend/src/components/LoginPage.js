import React, { useState } from 'react';
import './LoginPage.css';
import toast, { Toaster } from 'react-hot-toast';
import { displayRazorpay } from './RazorpayPayment';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const checkValidityAndPay = async (userId, email) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/check-validity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok || data.isExpired) {
        // Validity expired, initiate payment
        const orderResponse = await fetch(`${process.env.REACT_APP_API_URL}/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: 50000, currency: 'INR', email }),
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) {
          throw new Error(orderData.message || 'Failed to create order');
        }

        await displayRazorpay({
          amount: 50000,
          email,
          order_id: orderData.order_id,
          description: 'Account Renewal Payment',
          onSuccess: async (paymentResponse) => {
            try {
              const renewResponse = await fetch(
                `${process.env.REACT_APP_API_URL}/renew-account`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                  body: JSON.stringify({
                    userId,
                    payment_id: paymentResponse.razorpay_payment_id,
                    order_id: paymentResponse.razorpay_order_id,
                    signature: paymentResponse.razorpay_signature,
                  }),
                }
              );

              const renewData = await renewResponse.json();
              if (renewResponse.ok) {
                localStorage.setItem('validity',  renewData.validity);
                toast.success('Account renewed successfully!');
                onLogin();
              } else {
                setErrorMessage(renewData.message || 'Failed to renew account.');
                toast.error(renewData.message || 'Failed to renew account.');
              }
            } catch (error) {
              setErrorMessage(error.message || 'Failed to process renewal.');
              toast.error(error.message || 'Failed to process renewal.');
            }
          },
          onFailure: (error) => {
            setErrorMessage(error || 'Payment failed.');
            toast.error(error || 'Payment failed.');
          },
        });
      } else {
        // Validity not expired
        onLogin();
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to check validity.');
      toast.error(error.message || 'Failed to check validity.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      setLoading(false);
      return;
    }

    setEmailError('');
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('validity', data.validity);
        toast.success('Login successful!', {
          style: {
            background: '#dcfce7',
            color: '#15803d',
          },
        });
        await checkValidityAndPay(data.userId, email);
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
    } finally {
      setLoading(false);
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

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {errorMessage && <p className="error">{errorMessage}</p>}

        <div className="links">
          <a href="/forgot-password">Forgot Password?</a>
          <br />
          <br />
          <a href="/create-account">Create New Account</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;