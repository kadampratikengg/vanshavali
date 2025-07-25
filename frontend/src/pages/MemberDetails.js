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
import axios from 'axios';

const MemberDetails = ({ setIsAuthenticated, name }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [legalName, setLegalName] = useState(name || 'User');
  const navigate = useNavigate();

  // Fetch user data to set legalName
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (token) {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/identity`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { personalData } = response.data;
          setLegalName(personalData?.LegalName || name || 'User');
        }
      } catch (err) {
        console.error('Fetch user data error:', err);
        setError('Failed to fetch user data');
      }
    };
    fetchUserData();
  }, [token, name]);

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

  const handleBack = () => {
    navigate('/dashboard');
  };

  // const handleDownload = async () => {
  //   try {
  //     setError('');
  //     setSuccess('');

  //     // Check if the generate-pdf endpoint exists
  //     try {
  //       await axios.head(`${process.env.REACT_APP_API_URL}/generate-pdf`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //     } catch (err) {
  //       if (err.response?.status === 404) {
  //         setError('PDF generation is not available at this time. Please contact support.');
  //         return;
  //       }
  //       throw err; // Rethrow other errors
  //     }

  //     // Proceed with PDF download
  //     const response = await axios.get(`${process.env.REACT_APP_API_URL}/generate-pdf`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //       responseType: 'blob',
  //     });

  //     // Create a blob URL for the PDF
  //     const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
  //     const url = window.URL.createObjectURL(pdfBlob);

  //     // Create a temporary link element to trigger download
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = `${legalName}_details.pdf`;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);

  //     setSuccess('PDF downloaded successfully');
  //   } catch (err) {
  //     console.error('Download PDF error:', err);
  //     setError(err.response?.status === 404 
  //       ? 'PDF generation endpoint not found. Please contact support.'
  //       : 'Failed to download PDF');
  //   }
  // };

  return (
    <div className="dashboard">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="content">
        <div className="main-content">
          <h2>Family Details of {legalName}</h2>
          <IdentitySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <FinancialSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <PropertySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <MedicalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <EducationSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <DigitalSection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <LegacySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <FamilySection setError={setError} setSuccess={setSuccess} handleSubmit={handleSubmit} token={token} isOpen={false} />
          <div className="flex justify-end mt-4">
  <div className="flex flex-row gap-4">
    <button
      onClick={handleBack}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Back to Dashboard
    </button>
    {/* <button
      onClick={handleDownload}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      Download PDF
    </button> */}
  </div>
</div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetails;