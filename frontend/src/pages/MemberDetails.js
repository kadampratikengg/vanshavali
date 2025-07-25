import React, { useState, useEffect } from 'react';
import './dashboard.css';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import IdentitySection from '../preview/IdentitySection';
import FinancialSection from '../preview/FinancialSection';
import PropertySection from '../preview/PropertySection';
import MedicalSection from '../preview/MedicalSection';
import EducationSection from '../preview/EducationSection';
import DigitalSection from '../preview/DigitalSection';
import LegacySection from '../preview/LegacySection';
import FamilySection from '../preview/FamilySection';

const MemberDetails = ({ setIsAuthenticated, name }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  // Listen for changes to localStorage token
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token') || '';
      setToken(newToken);
      if (!newToken) {
        setError('Authentication token missing. Please log in again.');
        setIsAuthenticated(false);
        navigate('/');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setIsAuthenticated, navigate, setError]);

  // Validate token presence on mount
  useEffect(() => {
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsAuthenticated(false);
      navigate('/');
    }
  }, [token, navigate, setError, setIsAuthenticated]);

  // Effect to handle toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error, {
        style: {
          background: '#fee2e2',
          color: '#b91c1c',
        },
      });
    }
    if (success) {
      toast.success(success, {
        style: {
          background: '#dcfce7',
          color: '#15803d',
        },
      });
    }
  }, [error, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Section-specific submissions are handled in respective components
  };

  return (
    <div className="dashboard">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="content">
        <div className="main-content">
          <h2>User Profile</h2>
          <IdentitySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <FinancialSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <PropertySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <MedicalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <EducationSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <DigitalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <LegacySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <FamilySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
        </div>
      </div>
    </div>
  );
};

export default MemberDetails;