// src/App.js
import React, { useState, useEffect } from 'react';
import { useLocation, BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './pages/Dashboard'; // Component that selects the correct dashboard based on role
import axios from 'axios';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Will hold { username, type } once logged in
  const [loading, setLoading] = useState(true);

  // Check for a valid token and update user state on app load.
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await axios.get('http://localhost:3000/verify-token', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.user) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <ConditionalHeader setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated
                ? <Navigate to="/dashboard" replace />
                : <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated && user
                ? <Dashboard user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
                : <Navigate to="/" replace />
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

// ConditionalHeader renders the header only on routes other than the login page.
function ConditionalHeader({ setIsAuthenticated, setUser }) {
  const location = useLocation();
  const noHeaderRoutes = ['/'];
  if (noHeaderRoutes.includes(location.pathname)) {
    return null;
  }
  return <Header setIsAuthenticated={setIsAuthenticated} setUser={setUser} />;
}

export default App;



