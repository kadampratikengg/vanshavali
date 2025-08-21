import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const FamilySection = ({ setError, setSuccess, userId, token }) => {
  const [familyMembers, setFamilyMembers] = useState([{
    id: 1,
    name: '',
    relation: 'Select Relation',
    aadhar: '',
    pan: '',
    passport: '',
    voterId: '',
    drivingLicense: '',
    file: null,
    fileUuid: null,
  }]);
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);
  const [addedDocuments, setAddedDocuments] = useState([]);
  const [uploadcareLoaded, setUploadcareLoaded] = useState(false);
  const widgetRefs = useRef({});

  useEffect(() => {
    console.log('Uploadcare Public Key:', process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY);
    console.log('API URL:', process.env.REACT_APP_API_URL);
  }, []);

  useEffect(() => {
    const loadUploadcare = async () => {
      try {
        console.log('Attempting to load Uploadcare script...');
        if (!window.uploadcare) {
          await import('https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js');
          window.UPLOADCARE_PUBLIC_KEY = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;
          console.log('Uploadcare script loaded successfully');
        }
        setUploadcareLoaded(true);
      } catch (error) {
        console.error('Uploadcare load error:', error);
        setError('Failed to load Uploadcare widget. Please try again later.');
        setTimeout(loadUploadcare, 5000);
      }
    };
    loadUploadcare();
  }, [setError]);

  useEffect(() => {
    if (!uploadcareLoaded || !window.uploadcare) {
      console.log('Uploadcare not loaded or window.uploadcare not available');
      return;
    }

    const initializeWidgets = () => {
      familyMembers.forEach((member) => {
        if (!widgetRefs.current[`family_${member.id}`]) {
          const selector = `[data-uploadcare-id="family_${member.id}"]`;
          const element = document.querySelector(selector);
          if (!element) {
            console.warn(`No DOM element found for selector ${selector}. Retrying...`);
            return;
          }
          try {
            console.log(`Initializing Uploadcare widget for Family ID: ${member.id}`);
            const widget = window.uploadcare.Widget(selector);
            widget.onUploadComplete((file) => {
              console.log(`File uploaded for Family ID ${member.id}:`, file);
              setFamilyMembers((prev) =>
                prev.map((row) =>
                  row.id === member.id ? { ...row, file, fileUuid: file.uuid } : row
                )
              );
            });
            widgetRefs.current[`family_${member.id}`] = widget;
            console.log(`Uploadcare widget initialized for Family ID: ${member.id}`);
          } catch (error) {
            console.error(`Uploadcare widget error for Family ID: ${member.id}`, error);
            setError('Failed to initialize Uploadcare widget');
          }
        }
      });
    };

    const timer = setTimeout(() => {
      initializeWidgets();
    }, 100);

    return () => {
      clearTimeout(timer);
      Object.values(widgetRefs.current).forEach((widget) => {
        try {
          console.log('Cleaning up Uploadcare widget');
        } catch (error) {
          console.error('Error cleaning up Uploadcare widget:', error);
        }
      });
      widgetRefs.current = {};
    };
  }, [uploadcareLoaded, familyMembers, setError]);

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          console.log('Token missing');
          return;
        }
        console.log('Fetching family data with token:', token);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/family`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Backend response (raw):', JSON.stringify(response.data, null, 2));
        const { familyMembers: fetchedData } = response.data;

        if (!fetchedData || !Array.isArray(fetchedData)) {
          console.warn('Invalid or missing familyMembers in response:', fetchedData);
          setError('Invalid data received from server');
          return;
        }

        const newFamilyMembers = [{
          id: 1,
          name: '',
          relation: 'Select Relation',
          aadhar: '',
          pan: '',
          passport: '',
          voterId: '',
          drivingLicense: '',
          file: null,
          fileUuid: null,
        }];
        const newAddedDocuments = fetchedData.map((item, index) => ({
          id: item._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || '',
          relation: item.relation || 'Select Relation',
          aadhar: item.aadhar || '',
          pan: item.pan || '',
          passport: item.passport || '',
          voterId: item.voterId || '',
          drivingLicense: item.drivingLicense || '',
          fileUrl: item.fileUrl || null,
        }));
        setFamilyMembers(newFamilyMembers);
        setAddedDocuments(newAddedDocuments);
        setShowAddedDocuments(newAddedDocuments.length > 0);
        console.log('Transformed familyMembers:', JSON.stringify(newFamilyMembers, null, 2));
        console.log('Transformed addedDocuments:', JSON.stringify(newAddedDocuments, null, 2));
      } catch (error) {
        console.error('Fetch error:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          } : 'No response received',
        });
        if (error.response?.status === 404) {
          console.warn('Family endpoint not found, using default data');
          setFamilyMembers([{
            id: 1,
            name: '',
            relation: 'Select Relation',
            aadhar: '',
            pan: '',
            passport: '',
            voterId: '',
            drivingLicense: '',
            file: null,
            fileUuid: null,
          }]);
          setAddedDocuments([]);
          setShowAddedDocuments(false);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch family data');
        }
      }
    };
    fetchFamilyData();
  }, [setError, token]);

  const renderTable = () => (
    <div className="table-container mb-6">
      {showAddedDocuments && (
        <div className="table-container mt-6">
          {addedDocuments.length === 0 ? (
            <p className="text-gray-500">No family members added yet.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Relation</th>
                  <th className="border p-2">Aadhar</th>
                  <th className="border p-2">PAN</th>
                  <th className="border p-2">Passport</th>
                  <th className="border p-2">Voter ID</th>
                  <th className="border p-2">Driving License</th>
                  <th className="border p-2">View File</th>
                </tr>
              </thead>
              <tbody>
                {addedDocuments.map((member) => (
                  <tr key={member.id} className="table-row">
                    <td className="border p-2">{member.name || 'N/A'}</td>
                    <td className="border p-2">{member.relation !== 'Select Relation' ? member.relation : 'N/A'}</td>
                    <td className="border p-2">{member.aadhar || 'N/A'}</td>
                    <td className="border p-2">{member.pan || 'N/A'}</td>
                    <td className="border p-2">{member.passport || 'N/A'}</td>
                    <td className="border p-2">{member.voterId || 'N/A'}</td>
                    <td className="border p-2">{member.drivingLicense || 'N/A'}</td>
                    <td className="border p-2">
                      {member.fileUrl ? (
                        <a href={member.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                          View File
                        </a>
                      ) : (
                        'No file uploaded'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="section family-section">
      <h3>Family Members</h3>
      <div className="section-content overflow-y-auto max-h-[500px]">
        {renderTable()}
      </div>
    </div>
  );
};

export default FamilySection;