// src/pages/UserDashboard.js
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link, useNavigate, Outlet } from 'react-router-dom';

const UserDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
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

      {/* Navigation links for normal user actions */}
      <div className="text-center mb-4">
        <Link
          to="passes"
          style={{
            marginRight: '1rem',
            fontSize: '1.1rem',
            textDecoration: 'none'
          }}
        >
          Passes Panel
        </Link>
        <Link
          to="balance"
          style={{
            fontSize: '1.1rem',
            textDecoration: 'none'
          }}
        >
          User Balance &amp; History
        </Link>
      </div>

      {/* Nested routes will render here */}
      <Outlet />
    </Container>
  );
};

export default UserDashboard;


