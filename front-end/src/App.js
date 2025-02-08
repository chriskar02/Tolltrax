import React, { useState, useEffect } from 'react';
import { useLocation, BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './components/Login';
import axios from 'axios';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Ensure we wait for authentication check

  // Check for a valid token on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        try {
          // Verify token with the backend
          const response = await axios.get('http://localhost:3000/api/auth/verify-token', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.user) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken'); // Invalid token, remove it
            setIsAuthenticated(false); // Force logout if token is invalid
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('authToken'); // Remove invalid token
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false); // Finish loading
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Prevent flashing the login page while checking auth
  }

  return (
    <Router>
      <div className="App">
        <ConditionalHeader />
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/home" replace /> : <Login setIsAuthenticated={setIsAuthenticated} />
            }
          />
          <Route
            path="/home"
            element={isAuthenticated ? <Home setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/admin"
            element={isAuthenticated ? <Admin /> : <Navigate to="/" replace />}
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

function ConditionalHeader() {
  const location = useLocation();
  const noHeaderRoutes = ['/'];
  if (noHeaderRoutes.includes(location.pathname)) {
    return null;
  }
  return <Header />;
}

export default App;
