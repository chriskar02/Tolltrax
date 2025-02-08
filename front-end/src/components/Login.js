import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(''); // Clear previous errors

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
      });

      const token = response.data.token;
      
      // Save token in localStorage
      localStorage.setItem('authToken', token);

      // Update authentication state
      setIsAuthenticated(true);

      console.log("Login successful! Redirecting...");
      navigate('/home');
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
      <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <Row>
          <Col xs={10} md={12} lg={12}> {/* Adjust column width */}
            <h2 className="text-center mb-4">Login</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit} className="p-4 border rounded bg-white shadow">
              <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100">
                Login
              </Button>
              <p className="text-center mt-3">
                <a href="#" style={{ textDecoration: 'underline', color: 'blue' }}>
                  No account? Sign Up
                </a>
              </p>
            </Form>
          </Col>
        </Row>
      </Container>
  );
}

export default Login;
