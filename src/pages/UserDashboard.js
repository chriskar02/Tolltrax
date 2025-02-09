import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

const UserDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <Container className="mt-5 text-center">
      <h1>Welcome, {user.username}</h1>
      <p>This is your user dashboard.</p>
      <Button variant="danger" onClick={handleLogout}>Logout</Button>
    </Container>
  );
};

export default UserDashboard;
