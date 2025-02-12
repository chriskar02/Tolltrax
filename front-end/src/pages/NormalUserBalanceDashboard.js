// src/pages/NormalUserBalanceDashboard.js
import React, { useState } from "react";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import axios from "axios";

function NormalUserBalanceDashboard() {
  const token = localStorage.getItem("authToken");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function to convert "YYYYMMDD" to "YYYY-MM-DD"
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  };

  const getUserBalanceAndHistory = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formattedFromDate = formatDate(dateFrom);
      const formattedToDate = formatDate(dateTo);
      const response = await axios.get(
        `http://localhost:9115/api/user?fromDate=${formattedFromDate}&toDate=${formattedToDate}`,
        {
          headers: { 'x-observatory-auth': `Bearer ${token}` }
        }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">User Balance &amp; History</h2>
      <Form>
        <Form.Group controlId="dateFrom" className="mb-2">
          <Form.Label>Date From (YYYYMMDD)</Form.Label>
          <Form.Control
            type="text"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="e.g., 20220101"
          />
        </Form.Group>
        <Form.Group controlId="dateTo" className="mb-2">
          <Form.Label>Date To (YYYYMMDD)</Form.Label>
          <Form.Control
            type="text"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="e.g., 20220131"
          />
        </Form.Group>
      </Form>
      <Button variant="primary" onClick={getUserBalanceAndHistory} className="mt-2">
        Get User Balance &amp; History
      </Button>
      {loading && <Spinner animation="border" className="mt-2" />}
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      {result ? (
        <Card className="mt-2">
          <Card.Body>
            <h6>User Balance: {result.balance}</h6>
            <pre>{JSON.stringify(result.history, null, 2)}</pre>
          </Card.Body>
        </Card>
      ) : (
        <div className="text-center mt-2">
          Please enter dates and click the button to view balance and history.
        </div>
      )}
    </Container>
  );
}

export default NormalUserBalanceDashboard;


