import React, { useState } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

const LegacySection = ({ setError, setSuccess, handleSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [personalLegacy, setPersonalLegacy] = useState({
    Diary: '',
    Letters: '',
    FamilyMedia: '',
    VoiceMessages: '',
    Traditions: '',
    Values: '',
  });
  const [files, setFiles] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonalLegacy((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (name) => (e) => {
    const file = e.target.files[0];
    setFiles((prev) => ({ ...prev, [name]: file }));
  };

  const handleSectionSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log({ personalLegacy, files });
    handleSubmit(e);
  };

  return (
    <form className="section legacy-section" onSubmit={handleSectionSubmit}>
      <h3 onClick={() => setExpanded((prev) => !prev)}>
        Personal and Emotional Legacy
        {expanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
      </h3>
      <div className={`section-content ${expanded ? 'expanded' : 'collapsed'} overflow-y-auto max-h-[500px]`}>
        <div className="form-grid">
          {Object.keys(personalLegacy).map((key) => (
            <div key={key} className="form-row">
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').trim()}:</label>
                  <textarea
                    id={key}
                    name={key}
                    value={personalLegacy[key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                {['FamilyMedia', 'VoiceMessages'].includes(key) && (
                  <div>
                    <label htmlFor={`${key}File`}>Upload {key.replace(/([A-Z])/g, ' $1').trim()}:</label>
                    <input
                      type="file"
                      id={`${key}File`}
                      name={`${key}File`}
                      onChange={handleFileChange(`${key}File`)}
                      className="w-full p-2 border rounded"
                      accept=".pdf,.jpg,.png,.mp4,.mp3"
                    />
                    {files[`${key}File`] && (
                      <p className="text-sm text-gray-500 mt-1">Uploaded: {files[`${key}File`].name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};

export default LegacySection;