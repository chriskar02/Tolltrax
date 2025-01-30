import React, { useState } from 'react';
import { useLocation, BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './components/Login'; // yiannis

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track login state

  return (
      <Router>
        <div className="App">
          <ConditionalHeader />
          <Routes>
            {/* Login Route */}
            <Route
                path="/"
                element={
                  isAuthenticated ? (
                      <Navigate to="/home" replace />
                  ) : (
                      <Login setIsAuthenticated={setIsAuthenticated} />
                  )
                }
            />
            {/* Home Route */}
            <Route
                path="/home"
                element={
                  isAuthenticated ? <Home /> : <Navigate to="/" replace />
                }
            />
            {/* Admin Route */}
            <Route
                path="/admin"
                element={
                  isAuthenticated ? <Admin /> : <Navigate to="/" replace />
                }
            />
          </Routes>
          <Footer />
        </div>
      </Router>
  );
}

// Conditionally render the header
function ConditionalHeader() {
  const location = useLocation();
  const noHeaderRoutes = ['/']; // Do not show header on Login

  if (noHeaderRoutes.includes(location.pathname)) {
    return null;
  }

  return <Header />;
}

export default App;
