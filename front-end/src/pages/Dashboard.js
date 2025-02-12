// src/pages/Dashboard.js
import React from 'react';
import UserDashboard from './UserDashboard';
import AnalystDashboard from './AnalystDashboard';
import OperatorDashboard from './OperatorDashboard';
import AdminDashboard from './AdminDashboard';

function Dashboard({ user, setIsAuthenticated, setUser }) {
  // Normalize user type: convert to lowercase and trim extra spaces.
  const normalizedUserType = user && user.type ? user.type.toLowerCase().trim() : '';
  console.log("Dashboard: normalized user type:", normalizedUserType);
  console.log("Full user object:", user);

  if (normalizedUserType === "normal") {
    return (
      <UserDashboard
        user={user}
        setIsAuthenticated={setIsAuthenticated}
        setUser={setUser}
      />
    );
  } else if (normalizedUserType === "analyst") {
    return (
      <AnalystDashboard
        user={user}
        setIsAuthenticated={setIsAuthenticated}
      />
    );
  } else if (normalizedUserType === "admin") {
    return (
      <AdminDashboard
        user={user}
        setIsAuthenticated={setIsAuthenticated}
      />
    );
  } else {
    // For any type that isn't "normal", "analyst", or "admin" assume it's an operator.
    return (
      <OperatorDashboard
        user={user}
        setIsAuthenticated={setIsAuthenticated}
      />
    );
  }
}

export default Dashboard;





