import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage'; // Main login page
import AdminLoginPage from './admin/admin'; // Import LoginPage from admin.js, renamed for clarity
import CreateAccountPage from './components/create-account';
import ForgotPasswordPage from './components/forgot-password';
import AdminCreateAccountPage from './admin/admin-create-account';
import AdminForgotPasswordPage from './admin/admin-forgot-password';
import Dashboard from './pages/dashboard';
import AdminDashboard from './admin/AdminDashboard';
import Profile from './pages/profile';
import Settings from './pages/settings';
import UserProfile from './admin/userprofile';
import UserSettings from './admin/usersettings';
import FamilyTree from './pages/FamilyTree';
import MemberDetails from './pages/MemberDetails';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is authenticated when the app loads
  useEffect(() => {
    const storedAuthState = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(storedAuthState === 'true');
  }, []);

  // Handle login and store the authentication state in localStorage
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  return (
    <Router>
      <div className='App'>
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path='/' element={<Navigate to='/dashboard' />} />
              <Route path='/dashboard' element={<Dashboard setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/admin/dashboard" element={<AdminDashboard setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/profile' element={<Profile setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/settings' element={<Settings setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/admin/userprofile' element={<UserProfile setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/admin/usersettings' element={<UserSettings setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/family-tree" element={<FamilyTree setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/member-details" element={<MemberDetails setIsAuthenticated={setIsAuthenticated} />} />
            </>
          ) : (
            <>
              <Route path='/' element={<LoginPage onLogin={handleLogin} />} />
              <Route path='/admin' element={<AdminLoginPage onLogin={handleLogin} />} /> {/* Use AdminLoginPage */}
              <Route path='/create-account' element={<CreateAccountPage />} />
              <Route path='/forgot-password' element={<ForgotPasswordPage />} />
              <Route path='/admin-create-account' element={<AdminCreateAccountPage />} />
              <Route path='/admin-forgot-password' element={<AdminForgotPasswordPage />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
};

export default App;