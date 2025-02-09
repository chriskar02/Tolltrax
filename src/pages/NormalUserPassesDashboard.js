// src/pages/NormalUserPassesDashboard.js
import React, { useState } from "react";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import axios from "axios";

function NormalUserPassesDashboard() {
  const token = localStorage.getItem("authToken");

  // ------------------------------
  // Toll Station Passes Section States
  // ------------------------------
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

  // ------------------------------
  // Pass Analysis Section States
  // ------------------------------
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
        `http://localhost:3000/api/passAnalysis/${paStationOpID}/${paTagOpID}/${paDateFrom}/${paDateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaResult(response.data);
    } catch (err) {
      setPaError(err.response?.data?.info || err.message);
    } finally {
      setPaLoading(false);
    }
  };

  // ------------------------------
  // Passes Cost Section States
  // ------------------------------
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
        `http://localhost:3000/api/passesCost/${pcTollOpID}/${pcTagOpID}/${pcDateFrom}/${pcDateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPcResult(response.data);
    } catch (err) {
      setPcError(err.response?.data?.info || err.message);
    } finally {
      setPcLoading(false);
    }
  };

  // ------------------------------
  // Charges By Section States
  // ------------------------------
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
        `http://localhost:3000/api/chargesBy/${cbTollOpID}/${cbDateFrom}/${cbDateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
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

export default NormalUserPassesDashboard;



