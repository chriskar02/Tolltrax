import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const OperatorDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <Container className="mt-5 text-center">
      <h1>Welcome, {user.username}</h1>
      <p>This is your operator dashboard. (Add your specific features here.)</p>
      <Button variant="danger" onClick={handleLogout}>Logout</Button>
    </Container>
  );
};

export default OperatorDashboard;
