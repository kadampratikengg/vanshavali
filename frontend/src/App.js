import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import CreateAccountPage from './components/create-account';
import ForgotPasswordPage from './components/forgot-password';
import Dashboard from './pages/dashboard';
import Profile from './pages/profile';
import Settings from './pages/settings';
import FamilyTree from './pages/FamilyTree';
import MemberDetails from './pages/MemberDetails';


const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is authenticated when the app loads
  useEffect(() => {
    // Retrieve authentication state from localStorage
    const storedAuthState = localStorage.getItem('isAuthenticated');

    // If storedAuthState is not null or not 'true', consider user as unauthenticated
    setIsAuthenticated(storedAuthState === 'true');
  }, []);

  // Handle login and store the authentication state in localStorage
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true'); // Save authentication state to localStorage
  };

  return (
    <Router>
      <div className='App'>
        <Routes>
          {/* If the user is authenticated, redirect them to /dashboard */}
          {isAuthenticated ? (
            <>
              <Route path='/' element={<Navigate to='/dashboard' />} />
              <Route path='/dashboard' element={<Dashboard setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/profile' element={<Profile setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/settings' element={<Settings setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/family-tree" element={<FamilyTree setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/member-details" element={<MemberDetails  setIsAuthenticated={setIsAuthenticated}/>} />
              
            </>
          ) : (
            <>
              <Route path='/' element={<LoginPage onLogin={handleLogin} />} />
              <Route path='/create-account' element={<CreateAccountPage />} />
              <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
};

export default App;