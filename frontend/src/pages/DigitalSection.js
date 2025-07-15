import React, { useState } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

const DigitalSection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [digitalAccess, setDigitalAccess] = useState({
    MobileNumbers: '',
    EmailAccounts: '',
    SocialMedia: '',
    OnlineBanking: '',
    Subscriptions: '',
    CloudStorage: '',
    WebsiteDomains: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDigitalAccess((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSectionSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log({ digitalAccess });
    handleSubmit(e);
  };

  return (
    <form className="section digital-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Digital Access Information
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        <div className="form-grid">
          {Object.keys(digitalAccess).map((key) => (
            <div key={key} className="form-row">
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').trim()}:</label>
                  <input
                    type="text"
                    id={key}
                    name={key}
                    value={digitalAccess[key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Store digital access in a secure password manager or encrypted file.
        </p>
      </div>
    </form>
  );
};

export default DigitalSection;