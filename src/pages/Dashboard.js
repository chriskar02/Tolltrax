// Dashboard.js
import React from "react";
import { Container, Button } from "react-bootstrap";
import { Link, Outlet, useNavigate } from "react-router-dom";

export default function Dashboard({ user, setIsAuthenticated, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/");
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center">Welcome, {user.username}</h1>
      <div className="text-center mb-4">
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      
      {/* Use absolute paths so we don't keep nesting */}
      <div className="text-center mb-4">
        <Link to="/dashboard/passes" style={{ marginRight: 16 }}>
          Passes Panel
        </Link>
        <Link to="/dashboard/balance">
          User Balance &amp; History
        </Link>
      </div>

      <Outlet />
    </Container>
  );
}



