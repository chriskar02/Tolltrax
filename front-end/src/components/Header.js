// src/components/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

function Header({ setIsAuthenticated, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the token from localStorage
    localStorage.removeItem('authToken');
    // Clear authentication state and user data
    setIsAuthenticated(false);
    setUser(null);
    // Navigate back to the login page
    navigate('/');
  };

  return (
    <header>
      <nav>
        <ul style={{ display: 'flex', listStyle: 'none', alignItems: 'center', padding: '1rem' }}>
          {/* Removed the Dashboard link */}
          <li>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;


