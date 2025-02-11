import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("Logout button clicked"); // Debug log

    // Remove authentication token
    localStorage.removeItem('authToken');

    // Update authentication state
    setIsAuthenticated(false);

    console.log("Token removed, navigating to login..."); // Debug log

    // Redirect to login page
    navigate('/');
  };

  return (
    <div className="container mt-5 text-center">
      <h1>Welcome to TollTrax</h1>
      <p>Your one-stop solution for toll management.</p>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="btn btn-danger mt-4"
      >
        Logout
      </button>
    </div>
  );
};

export default HomePage;
