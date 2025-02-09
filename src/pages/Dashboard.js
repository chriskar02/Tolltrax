import React from 'react';
import AdminDashboard from './AdminDashboard';
import AnalystDashboard from './AnalystDashboard';
import OperatorDashboard from './OperatorDashboard';
import UserDashboard from './UserDashboard';

function Dashboard({ user, setIsAuthenticated }) {
  // You can customize the following switch however you wish
  switch (user.type) {
    case 3:
      return <AdminDashboard user={user} />;
    case 2:
      return <AnalystDashboard user={user} setIsAuthenticated={setIsAuthenticated} />;
    case 1:
      return <OperatorDashboard user={user} setIsAuthenticated={setIsAuthenticated} />;
    case 0:
    default:
      return <UserDashboard user={user} setIsAuthenticated={setIsAuthenticated} />;
  }
}

export default Dashboard;
