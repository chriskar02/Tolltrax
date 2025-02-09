// src/pages/UserDashboard.js
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import NormalUserPassesDashboard from './NormalUserPassesDashboard';

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
      <NormalUserPassesDashboard />
    </Container>
  );
};

export default UserDashboard;

