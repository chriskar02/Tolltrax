// src/pages/UserDashboard.js
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const UserDashboard = ({ user, setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center">Welcome, {user.username}</h1>

      <div className="text-center mb-4">
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Use ABSOLUTE paths to avoid stacking / nesting issues */}
      <div className="text-center mb-4">
        <Link
          to="/dashboard/passes"
          style={{ marginRight: '1rem', fontSize: '1.1rem', textDecoration: 'none' }}
        >
          Passes Panel
        </Link>
        <Link
          to="/dashboard/balance"
          style={{ fontSize: '1.1rem', textDecoration: 'none' }}
        >
          User Balance &amp; History
        </Link>
      </div>

      {/* Nested routes (passes or balance) will render here */}
      <Outlet />
    </Container>
  );
};

export default UserDashboard;




