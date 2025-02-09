import React from 'react';
import AdminDashboard from './AdminDashboard';
import AnalystDashboard from './AnalystDashboard';
import OperatorDashboard from './OperatorDashboard';
import UserDashboard from './UserDashboard';

function Dashboard({ user, setIsAuthenticated }) {
  switch (user.type) {
    case "admin":
      return <AdminDashboard user={user} />;
    case "analyst":
      return <AnalystDashboard user={user} setIsAuthenticated={setIsAuthenticated} />;
    case "normal":
      return <UserDashboard user={user} setIsAuthenticated={setIsAuthenticated} />;
    default:
      return <OperatorDashboard user={user} setIsAuthenticated={setIsAuthenticated} />;
  }
}


export default Dashboard;
