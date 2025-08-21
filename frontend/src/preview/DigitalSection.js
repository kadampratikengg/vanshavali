import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DigitalSection = ({ setError, setSuccess, userId, token }) => {
 
  const [showAddedDocuments, setShowAddedDocuments] = useState(false);
  const [addedDocuments, setAddedDocuments] = useState([]);

  useEffect(() => {
    const fetchDigitalData = async () => {
      try {
        if (!token) {
          setError('No authentication token found');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/digital`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { digitalData: fetchedData } = response.data;
        console.log('Fetched digital data:', fetchedData);
        if (!fetchedData || !Array.isArray(fetchedData)) {
          console.warn('Invalid digital data structure from server:', fetchedData);
          setAddedDocuments([]);
          setShowAddedDocuments(false);
          return;
        }
        setAddedDocuments(
          fetchedData.map((item) => ({
            id: item._id,
            type: item.type,
            details: item.details,
            remark: item.remark,
          }))
        );
        setShowAddedDocuments(fetchedData.length > 0);
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('Digital endpoint not found, using default data');
          setAddedDocuments([]);
          setShowAddedDocuments(false);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch digital data');
          console.error('Fetch digital data error:', error);
        }
      }
    };
    fetchDigitalData();
  }, [setError, token]);

  return (
    <div className="section digital-section">
      <h3>
        Digital Access Information
      </h3>
      <div className="section-content overflow-y-auto max-h-[500px]">
        {showAddedDocuments && (
          <div className="table-container mt-6">
           
            {addedDocuments.length === 0 ? (
              <p className="text-gray-500">No digital access details added yet.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Details (ID/Username)</th>
                    <th className="border p-2">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {addedDocuments.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="border p-2">{item.type !== 'Select Type' ? item.type : 'N/A'}</td>
                      <td className="border p-2">{item.details || 'N/A'}</td>
                      <td className="border p-2">{item.remark || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalSection;