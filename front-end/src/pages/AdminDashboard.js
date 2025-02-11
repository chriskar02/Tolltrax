// src/pages/AdminDashboard.js
import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import axios from "axios";

function AdminDashboard({ user }) {
  // ------------------------------
  // ADMIN FUNCTIONALITIES
  // ------------------------------
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [healthData, setHealthData] = useState(null);

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

  async function resetStations() {
    await performAction(
      () => axios.post("http://localhost:9115/api/admin/resetstations"),
      "Stations reset successfully"
    );
  }

  async function resetPasses() {
    await performAction(
      () => axios.post("http://localhost:9115/api/admin/resetpasses"),
      "Passes reset successfully"
    );
  }

  async function addPasses() {
    await performAction(
      () => axios.post("http://localhost:9115/api/admin/addpasses"),
      (response) => `Passes added successfully. New passes: ${response.data.newPasses}`
    );
  }

  async function performHealthcheck() {
    await performAction(
      () => axios.get("http://localhost:9115/api/admin/healthcheck"),
      "Healthcheck completed successfully!",
      true
    );
  }

  const adminActions = [
    { name: "Reset Stations", action: resetStations, variant: "warning" },
    { name: "Reset Passes", action: resetPasses, variant: "danger" },
    { name: "Add Passes", action: addPasses, variant: "success" },
    { name: "Healthcheck", action: performHealthcheck, variant: "info" },
  ];

  // ------------------------------
  // NORMAL USER FUNCTIONALITIES (Passes Panel)
  // ------------------------------
  const token = localStorage.getItem("authToken");

  // Toll Station Passes Section States
  const [tollStationID, setTollStationID] = useState("");
  const [tsDateFrom, setTsDateFrom] = useState("");
  const [tsDateTo, setTsDateTo] = useState("");
  const [tsResult, setTsResult] = useState(null);
  const [tsError, setTsError] = useState(null);
  const [tsLoading, setTsLoading] = useState(false);

  const getTollStationPasses = async () => {
    console.log("getTollStationPasses button clicked");
    setTsLoading(true);
    setTsError(null);
    setTsResult(null);
    try {
      const response = await axios.get(
        `http://localhost:9115/api/tollStationPasses/${tollStationID}/${tsDateFrom}/${tsDateTo}`,
        { headers: { 'x-observatory-auth': token } }
      );
      setTsResult(response.data);
    } catch (err) {
      setTsError(err.response?.data?.info || err.message);
    } finally {
      setTsLoading(false);
    }
  };

  // Pass Analysis Section States
  const [paStationOpID, setPaStationOpID] = useState("");
  const [paTagOpID, setPaTagOpID] = useState("");
  const [paDateFrom, setPaDateFrom] = useState("");
  const [paDateTo, setPaDateTo] = useState("");
  const [paResult, setPaResult] = useState(null);
  const [paError, setPaError] = useState(null);
  const [paLoading, setPaLoading] = useState(false);

  const getPassAnalysis = async () => {
    console.log("getPassAnalysis button clicked");
    setPaLoading(true);
    setPaError(null);
    setPaResult(null);
    try {
      const response = await axios.get(
        `http://localhost:9115/api/passAnalysis/${paStationOpID}/${paTagOpID}/${paDateFrom}/${paDateTo}`,
        { headers: { 'x-observatory-auth': token } }
      );
      setPaResult(response.data);
    } catch (err) {
      setPaError(err.response?.data?.info || err.message);
    } finally {
      setPaLoading(false);
    }
  };

  // Passes Cost Section States
  const [pcTollOpID, setPcTollOpID] = useState("");
  const [pcTagOpID, setPcTagOpID] = useState("");
  const [pcDateFrom, setPcDateFrom] = useState("");
  const [pcDateTo, setPcDateTo] = useState("");
  const [pcResult, setPcResult] = useState(null);
  const [pcError, setPcError] = useState(null);
  const [pcLoading, setPcLoading] = useState(false);

  const getPassesCost = async () => {
    console.log("getPassesCost button clicked");
    setPcLoading(true);
    setPcError(null);
    setPcResult(null);
    try {
      const response = await axios.get(
        `http://localhost:9115/api/passesCost/${pcTollOpID}/${pcTagOpID}/${pcDateFrom}/${pcDateTo}`,
        { headers: { 'x-observatory-auth': token } }
      );
      setPcResult(response.data);
    } catch (err) {
      setPcError(err.response?.data?.info || err.message);
    } finally {
      setPcLoading(false);
    }
  };

  // Charges By Section States
  const [cbTollOpID, setCbTollOpID] = useState("");
  const [cbDateFrom, setCbDateFrom] = useState("");
  const [cbDateTo, setCbDateTo] = useState("");
  const [cbResult, setCbResult] = useState(null);
  const [cbError, setCbError] = useState(null);
  const [cbLoading, setCbLoading] = useState(false);

  const getChargesBy = async () => {
    console.log("getChargesBy button clicked");
    setCbLoading(true);
    setCbError(null);
    setCbResult(null);
    try {
      const response = await axios.get(
        `http://localhost:9115/api/chargesBy/${cbTollOpID}/${cbDateFrom}/${cbDateTo}`,
        { headers: { 'x-observatory-auth': token } }
      );
      setCbResult(response.data);
    } catch (err) {
      setCbError(err.response?.data?.info || err.message);
    } finally {
      setCbLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      {/* ADMIN CONTROL PANEL */}
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
        <Alert variant={message.includes("Error") ? "danger" : "success"} className="text-center">
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
                <p>
                  <strong>Database Connection:</strong> {healthData.dbconnection}
                </p>
                <p>
                  <strong>Number of Stations:</strong> {healthData.n_stations}
                </p>
              </Col>
              <Col md={6}>
                <p>
                  <strong>Number of Tags:</strong> {healthData.n_tags}
                </p>
                <p>
                  <strong>Number of Passes:</strong> {healthData.n_passes}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <hr className="my-5" />

      {/* PASSES PANEL (NORMAL USER FUNCTIONALITIES) */}
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

      {/* Pass Analysis Section */}
      <Card className="mb-4">
        <Card.Header>Pass Analysis</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="paStationOpID" className="mb-2">
              <Form.Label>Station Operator ID</Form.Label>
              <Form.Control
                type="text"
                value={paStationOpID}
                onChange={(e) => setPaStationOpID(e.target.value)}
                placeholder="e.g., OP1"
              />
            </Form.Group>
            <Form.Group controlId="paTagOpID" className="mb-2">
              <Form.Label>Tag Operator ID</Form.Label>
              <Form.Control
                type="text"
                value={paTagOpID}
                onChange={(e) => setPaTagOpID(e.target.value)}
                placeholder="e.g., OP2"
              />
            </Form.Group>
            <Form.Group controlId="paDateFrom" className="mb-2">
              <Form.Label>Date From (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={paDateFrom}
                onChange={(e) => setPaDateFrom(e.target.value)}
                placeholder="e.g., 20220101"
              />
            </Form.Group>
            <Form.Group controlId="paDateTo" className="mb-2">
              <Form.Label>Date To (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={paDateTo}
                onChange={(e) => setPaDateTo(e.target.value)}
                placeholder="e.g., 20220131"
              />
            </Form.Group>
          </Form>
          <Button variant="secondary" onClick={getPassAnalysis} className="mt-2">
            Get Pass Analysis
          </Button>
          {paLoading && <Spinner animation="border" className="mt-2" />}
          {paError && <Alert variant="danger" className="mt-2">{paError}</Alert>}
          {paResult && (
            <Card className="mt-2">
              <Card.Body>
                <pre>{JSON.stringify(paResult, null, 2)}</pre>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* Passes Cost Section */}
      <Card className="mb-4">
        <Card.Header>Passes Cost</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="pcTollOpID" className="mb-2">
              <Form.Label>Toll Operator ID</Form.Label>
              <Form.Control
                type="text"
                value={pcTollOpID}
                onChange={(e) => setPcTollOpID(e.target.value)}
                placeholder="e.g., OP1"
              />
            </Form.Group>
            <Form.Group controlId="pcTagOpID" className="mb-2">
              <Form.Label>Tag Operator ID</Form.Label>
              <Form.Control
                type="text"
                value={pcTagOpID}
                onChange={(e) => setPcTagOpID(e.target.value)}
                placeholder="e.g., OP2"
              />
            </Form.Group>
            <Form.Group controlId="pcDateFrom" className="mb-2">
              <Form.Label>Date From (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={pcDateFrom}
                onChange={(e) => setPcDateFrom(e.target.value)}
                placeholder="e.g., 20220101"
              />
            </Form.Group>
            <Form.Group controlId="pcDateTo" className="mb-2">
              <Form.Label>Date To (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={pcDateTo}
                onChange={(e) => setPcDateTo(e.target.value)}
                placeholder="e.g., 20220131"
              />
            </Form.Group>
          </Form>
          <Button variant="success" onClick={getPassesCost} className="mt-2">
            Get Passes Cost
          </Button>
          {pcLoading && <Spinner animation="border" className="mt-2" />}
          {pcError && <Alert variant="danger" className="mt-2">{pcError}</Alert>}
          {pcResult && (
            <Card className="mt-2">
              <Card.Body>
                <pre>{JSON.stringify(pcResult, null, 2)}</pre>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* Charges By Section */}
      <Card className="mb-4">
        <Card.Header>Charges By</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="cbTollOpID" className="mb-2">
              <Form.Label>Toll Operator ID</Form.Label>
              <Form.Control
                type="text"
                value={cbTollOpID}
                onChange={(e) => setCbTollOpID(e.target.value)}
                placeholder="e.g., OP1"
              />
            </Form.Group>
            <Form.Group controlId="cbDateFrom" className="mb-2">
              <Form.Label>Date From (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={cbDateFrom}
                onChange={(e) => setCbDateFrom(e.target.value)}
                placeholder="e.g., 20220101"
              />
            </Form.Group>
            <Form.Group controlId="cbDateTo" className="mb-2">
              <Form.Label>Date To (YYYYMMDD)</Form.Label>
              <Form.Control
                type="text"
                value={cbDateTo}
                onChange={(e) => setCbDateTo(e.target.value)}
                placeholder="e.g., 20220131"
              />
            </Form.Group>
          </Form>
          <Button variant="info" onClick={getChargesBy} className="mt-2">
            Get Charges By
          </Button>
          {cbLoading && <Spinner animation="border" className="mt-2" />}
          {cbError && <Alert variant="danger" className="mt-2">{cbError}</Alert>}
          {cbResult && (
            <Card className="mt-2">
              <Card.Body>
                <pre>{JSON.stringify(cbResult, null, 2)}</pre>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminDashboard;
