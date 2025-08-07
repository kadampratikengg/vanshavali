import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const PropertySection = ({ setError, setSuccess, userId, token }) => {
  
  const [propertyData, setPropertyData] = useState([{
    id: 1,
    section: 'Property Details',
    documentType: 'Select Document',
    documentNumber: '',
    remark: '',
    file: null,
    fileUuid: null,
  }]);
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
      propertyData.forEach((item) => {
        if (!widgetRefs.current[`${item.section}_${item.id}`]) {
          const selector = `[data-uploadcare-id="${item.section}_${item.id}"]`;
          const element = document.querySelector(selector);
          if (!element) {
            console.warn(`No DOM element found for selector ${selector}. Retrying...`);
            return;
          }
          try {
            console.log(`Initializing Uploadcare widget for ${item.section} ID: ${item.id}`);
            const widget = window.uploadcare.Widget(selector);
            widget.onUploadComplete((file) => {
              console.log(`File uploaded for ${item.section} ID ${item.id}:`, file);
              setPropertyData((prev) =>
                prev.map((row) =>
                  row.id === item.id ? { ...row, file, fileUuid: file.uuid } : row
                )
              );
            });
            widgetRefs.current[`${item.section}_${item.id}`] = widget;
            console.log(`Uploadcare widget initialized for ${item.section} ID: ${item.id}`);
          } catch (error) {
            console.error(`Uploadcare widget error for ${item.section} ID: ${item.id}`, error);
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
  }, [uploadcareLoaded, propertyData, setError]);

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          console.log('Token missing');
          return;
        }
        console.log('Fetching property data with token:', token);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/property`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Backend response:', JSON.stringify(response.data, null, 2));
        const { propertyData: fetchedData } = response.data;

        if (!fetchedData || typeof fetchedData !== 'object') {
          console.warn('Invalid or missing propertyData in response:', fetchedData);
          setError('Invalid data received from server');
          return;
        }

        const newPropertyData = [{
          id: 1,
          section: 'Property Details',
          documentType: 'Select Document',
          documentNumber: '',
          remark: '',
          file: null,
          fileUuid: null,
        }];
        const newAddedDocuments = [
          ...(Array.isArray(fetchedData.PropertyDetails)
            ? fetchedData.PropertyDetails.map(item => ({
                id: item._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
                section: 'Property Details',
                documentType: item.landType || 'Select Document',
                documentNumber: item.propertyNumber || '',
                remark: item.areaAddress || '',
                fileUrl: item.fileUrl || null,
              }))
            : []),
          ...(Array.isArray(fetchedData.VehicleDetails)
            ? fetchedData.VehicleDetails.map(item => ({
                id: item._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
                section: 'Vehicle Details',
                documentType: item.vehicleInsurance || 'Select Document',
                documentNumber: item.vehicleNumber || '',
                remark: item.vehicleModel || '',
                fileUrl: item.fileUrl || null,
              }))
            : []),
          ...(Array.isArray(fetchedData.TransactionDetails)
            ? fetchedData.TransactionDetails.map(item => ({
                id: item._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
                section: 'Sale, Purchase, Agreements, Rent Details',
                documentType: item.type || 'Select Document',
                documentNumber: item.documentNumber || '',
                remark: item.details || '',
                fileUrl: item.fileUrl || null,
              }))
            : []),
        ];
        setPropertyData(newPropertyData);
        setAddedDocuments(newAddedDocuments);
        console.log('Transformed propertyData:', JSON.stringify(newPropertyData, null, 2));
        console.log('Transformed addedDocuments:', JSON.stringify(newAddedDocuments, null, 2));
      } catch (error) {
        console.error('Fetch error:', error);
        if (error.response?.status === 404) {
          console.warn('Property endpoint not found, using default data');
          const defaultData = [{
            id: 1,
            section: 'Property Details',
            documentType: 'Select Document',
            documentNumber: '',
            remark: '',
            file: null,
            fileUuid: null,
          }];
          setPropertyData(defaultData);
          setAddedDocuments([]);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch property data');
        }
      }
    };
    fetchPropertyData();
  }, [setError, token]);

  const renderTable = () => (
    <div className="table-container mb-6">
      {addedDocuments.length > 0 && (
        <div className="table-container mt-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Document Type</th>
                <th className="border p-2">Document Number</th>
                <th className="border p-2">Remark</th>
                <th className="border p-2">View File</th>
              </tr>
            </thead>
            <tbody>
              {addedDocuments.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="border p-2">{item.documentType}</td>
                  <td className="border p-2">{item.documentNumber || 'N/A'}</td>
                  <td className="border p-2">{item.remark || 'N/A'}</td>
                  <td className="border p-2">
                    {item.fileUrl ? (
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
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
        </div>
      )}
    </div>
  );

  return (
    <div className="section property-section">
      <h3>
        Property & Asset Information
      </h3>
      <div className="section-content overflow-y-auto max-h-[500px]">
        {renderTable()}
      </div>
    </div>
  );
};

export default PropertySection;