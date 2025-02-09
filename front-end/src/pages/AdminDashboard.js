import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";

function AdminDashboard({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [healthData, setHealthData] = useState(null);

  const adminActions = [
    { name: "Reset Stations", action: resetStations, variant: "warning" },
    { name: "Reset Passes", action: resetPasses, variant: "danger" },
    { name: "Add Passes", action: addPasses, variant: "success" },
    { name: "Healthcheck", action: performHealthcheck, variant: "info" },
  ];

  async function resetStations() {
    await performAction(
      () => axios.post("http://localhost:3000/api/admin/resetstations"),
      "Stations reset successfully"
    );
  }

  async function resetPasses() {
    await performAction(
      () => axios.post("http://localhost:3000/api/admin/resetpasses"),
      "Passes reset successfully"
    );
  }

  async function addPasses() {
    await performAction(
      () => axios.post("http://localhost:3000/api/admin/addpasses"),
      (response) => `Passes added successfully. New passes: ${response.data.newPasses}`
    );
  }

  async function performHealthcheck() {
    await performAction(
      () => axios.get("http://localhost:3000/api/admin/healthcheck"),
      "Healthcheck completed successfully!",
      true
    );
  }

  async function performAction(apiCall, successMessage, isHealthcheck = false) {
    setLoading(true);
    setMessage(null);
    setHealthData(null);

    try {
      const response = await apiCall();
      if (response.data.status === "OK") {
        setMessage(typeof successMessage === "function" ? successMessage(response) : successMessage);
        if (isHealthcheck) {
          setHealthData(response.data);
        }
      } else {
        setMessage(response.data.info || "Operation failed");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="admin-dashboard mt-5">
      <h1 className="text-center mb-4">Welcome, {user.username}</h1>
      <h2 className="text-center mb-4">Admin Control Panel</h2>
      <Row className="mb-4">
        {adminActions.map((action, index) => (
          <Col key={index} md={3} sm={6} className="mb-2">
            <Button
              variant={action.variant}
              onClick={action.action}
              disabled={loading}
              className="w-100"
            >
              {loading ? <Spinner animation="border" size="sm" /> : action.name}
            </Button>
          </Col>
        ))}
      </Row>

      {message && (
        <Alert
          variant={message.includes("Error") ? "danger" : "success"}
          className="text-center"
        >
          {message}
        </Alert>
      )}

      {healthData && (
        <Card className="mt-4">
          <Card.Header>
            <h2 className="text-center">System Health Details</h2>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Database Connection:</strong> {healthData.dbconnection}</p>
                <p><strong>Number of Stations:</strong> {healthData.n_stations}</p>
              </Col>
              <Col md={6}>
                <p><strong>Number of Tags:</strong> {healthData.n_tags}</p>
                <p><strong>Number of Passes:</strong> {healthData.n_passes}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default AdminDashboard;
