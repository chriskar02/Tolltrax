// src/pages/AnalystDashboard.js
import React, { useState } from 'react';
import { Container, Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalystDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [stationData, setStationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    navigate('/');
  };

  // Fetch station popularity from your backend API
  const handleFetchStationPopularity = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:9115/api/analytics/admin/station-popularity', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Use the custom header with Bearer token
          'x-observatory-auth': token,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setStationData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for Chart.js
  const chartData = {
    labels: stationData.map((item) => item.station_name), // These labels will be hidden on the axis
    datasets: [
      {
        label: 'Passthrough Count',
        data: stationData.map((item) => Number(item.passthrough_count)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        categoryPercentage: 0.8,
        barPercentage: 0.7, // Thicker bars
      },
    ],
  };

  // Chart options for better readability
  const chartOptions = {
    responsive: true,
    // indexAxis: 'y' makes the bar chart horizontal
    indexAxis: 'y',
    scales: {
      y: {
        // Hide the y-axis station names
        ticks: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Station Popularity',
      },
      // Show station names in the tooltip
      tooltip: {
        callbacks: {
          label: function (context) {
            const stationName = context.label;     // y-axis label
            const count = context.parsed.x;          // x-axis value
            return `${stationName}: ${count}`;
          },
        },
      },
    },
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center">Welcome, {user.username}</h1>
      <p className="text-center">
        This is your analyst dashboard. (Add your specific features here.)
      </p>

      <div className="d-flex justify-content-center mb-3">
        <Button variant="primary" onClick={handleFetchStationPopularity} disabled={loading}>
          {loading ? 'Loading...' : 'Load Station Popularity'}
        </Button>
      </div>

      {error && <p className="text-danger text-center">{error}</p>}

      {stationData.length > 0 && (
        <>
          {/* Chart with hidden Y-axis labels (but station names in tooltips) */}
          <div className="mt-4">
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Numeric data table for reference */}
          <Table striped bordered hover className="mt-4">
            <thead>
              <tr>
                <th>Station Name</th>
                <th>Passthrough Count</th>
              </tr>
            </thead>
            <tbody>
              {stationData.map((station, index) => (
                <tr key={index}>
                  <td>{station.station_name}</td>
                  <td>{station.passthrough_count}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <div className="text-center mt-3">
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </Container>
  );
};

export default AnalystDashboard;
