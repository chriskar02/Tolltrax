// src/pages/NormalUserPassesDashboard.js
import React, { useState } from "react";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import axios from "axios";

function NormalUserPassesDashboard() {
  const token = localStorage.getItem("authToken");

  // Example: Toll Station Passes Section states
  const [tollStationID, setTollStationID] = useState("");
  const [tsDateFrom, setTsDateFrom] = useState("");
  const [tsDateTo, setTsDateTo] = useState("");
  const [tsResult, setTsResult] = useState(null);
  const [tsError, setTsError] = useState(null);
  const [tsLoading, setTsLoading] = useState(false);

  const getTollStationPasses = async () => {
    setTsLoading(true);
    setTsError(null);
    setTsResult(null);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/tollStationPasses/${tollStationID}/${tsDateFrom}/${tsDateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTsResult(response.data);
    } catch (err) {
      setTsError(err.response?.data?.info || err.message);
    } finally {
      setTsLoading(false);
    }
  };

  // You can add similar state/function sections for the other three passes-related features.

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Passes Panel</h2>

      {/* Toll Station Passes Section */}
      <Card className="mb-4">
        <Card.Header>Toll Station Passes</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="tollStationID" className="mb-2">
              <Form.Label>Toll Station ID</Form.Label>
              <Form.Control
                type="text"
                value={tollStationID}
                onChange={(e) => setTollStationID(e.target.value)}
                placeholder="e.g., NAO30"
              />
            </Form.Group>
            <Form.Group controlId="tsDateFrom" className="mb-2">
              <Form.Label>Date From (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={tsDateFrom}
                onChange={(e) => setTsDateFrom(e.target.value)}
                placeholder="e.g., 20220101"
              />
            </Form.Group>
            <Form.Group controlId="tsDateTo" className="mb-2">
              <Form.Label>Date To (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={tsDateTo}
                onChange={(e) => setTsDateTo(e.target.value)}
                placeholder="e.g., 20220101"
              />
            </Form.Group>
          </Form>
          <Button variant="primary" onClick={getTollStationPasses} className="mt-2">
            Get Toll Station Passes
          </Button>
          {tsLoading && <Spinner animation="border" className="mt-2" />}
          {tsError && <Alert variant="danger" className="mt-2">{tsError}</Alert>}
          {tsResult && (
            <Card className="mt-2">
              <Card.Body>
                <pre>{JSON.stringify(tsResult, null, 2)}</pre>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* Add additional sections for:
            - Pass Analysis
            - Passes Cost
            - Charges By */}
    </Container>
  );
}

export default NormalUserPassesDashboard;


