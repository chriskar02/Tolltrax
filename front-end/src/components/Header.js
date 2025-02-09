// src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
          <li style={{ marginRight: '1rem' }}>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;


