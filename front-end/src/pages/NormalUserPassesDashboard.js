// src/pages/NormalUserPassesDashboard.js
import React, { useState } from "react";
import { Container, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import axios from "axios";

// ------------------------------
// 1) TOLL STATION PASSES SECTION
// ------------------------------
const TollStationPassesSection = () => {
  const token = localStorage.getItem("authToken");
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

  return (
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
              placeholder="e.g., 20220105"
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
  );
};

// ------------------------------
// 2) PASS ANALYSIS SECTION
// ------------------------------
const PassAnalysisSection = () => {
  const token = localStorage.getItem("authToken");
  const [stationOpID, setStationOpID] = useState("");
  const [tagOpID, setTagOpID] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getPassAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // /passAnalysis/:stationOpID/:tagOpID/:date_from/:date_to
      const response = await axios.get(
        `http://localhost:9115/api/passAnalysis/${stationOpID}/${tagOpID}/${dateFrom}/${dateTo}`,
        { headers: { 'x-observatory-auth': token } }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.info || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>Pass Analysis</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group controlId="stationOpID" className="mb-2">
            <Form.Label>Station Operator ID</Form.Label>
            <Form.Control
              type="text"
              value={stationOpID}
              onChange={(e) => setStationOpID(e.target.value)}
              placeholder="e.g., OP1"
            />
          </Form.Group>
          <Form.Group controlId="tagOpID" className="mb-2">
            <Form.Label>Tag Operator ID</Form.Label>
            <Form.Control
              type="text"
              value={tagOpID}
              onChange={(e) => setTagOpID(e.target.value)}
              placeholder="e.g., OP2"
            />
          </Form.Group>
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
              placeholder="e.g., 20220105"
            />
          </Form.Group>
        </Form>

        <Button variant="primary" className="mt-2" onClick={getPassAnalysis}>
          Get Pass Analysis
        </Button>

        {loading && <Spinner animation="border" className="mt-2" />}
        {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
        {result && (
          <Card className="mt-2">
            <Card.Body>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
};

// ------------------------------
// 3) PASSES COST SECTION
// ------------------------------
const PassesCostSection = () => {
  const token = localStorage.getItem("authToken");
  const [tollOpID, setTollOpID] = useState("");
  const [tagOpID, setTagOpID] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getPassesCost = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // /passesCost/:tollOpID/:tagOpID/:date_from/:date_to
      const response = await axios.get(
        `http://localhost:9115/api/passesCost/${tollOpID}/${tagOpID}/${dateFrom}/${dateTo}`,
        { headers: { 'x-observatory-auth': token } }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.info || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>Passes Cost</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group controlId="tollOpID" className="mb-2">
            <Form.Label>Toll Operator ID</Form.Label>
            <Form.Control
              type="text"
              value={tollOpID}
              onChange={(e) => setTollOpID(e.target.value)}
              placeholder="e.g., OP1"
            />
          </Form.Group>
          <Form.Group controlId="tagOpID" className="mb-2">
            <Form.Label>Tag Operator ID</Form.Label>
            <Form.Control
              type="text"
              value={tagOpID}
              onChange={(e) => setTagOpID(e.target.value)}
              placeholder="e.g., OP2"
            />
          </Form.Group>
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
              placeholder="e.g., 20220105"
            />
          </Form.Group>
        </Form>

        <Button variant="primary" className="mt-2" onClick={getPassesCost}>
          Get Passes Cost
        </Button>

        {loading && <Spinner animation="border" className="mt-2" />}
        {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
        {result && (
          <Card className="mt-2">
            <Card.Body>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
};

// ------------------------------
// 4) CHARGES BY SECTION
// ------------------------------
const ChargesBySection = () => {
  const token = localStorage.getItem("authToken");
  const [tollOpID, setTollOpID] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getChargesBy = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // /chargesBy/:tollOpID/:date_from/:date_to
      const response = await axios.get(
        `http://localhost:9115/api/chargesBy/${tollOpID}/${dateFrom}/${dateTo}`,
        { headers: { 'x-observatory-auth': token } }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.info || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>Charges By</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group controlId="tollOpID" className="mb-2">
            <Form.Label>Toll Operator ID</Form.Label>
            <Form.Control
              type="text"
              value={tollOpID}
              onChange={(e) => setTollOpID(e.target.value)}
              placeholder="e.g., OP1"
            />
          </Form.Group>
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
              placeholder="e.g., 20220105"
            />
          </Form.Group>
        </Form>

        <Button variant="primary" className="mt-2" onClick={getChargesBy}>
          Get Charges By
        </Button>

        {loading && <Spinner animation="border" className="mt-2" />}
        {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
        {result && (
          <Card className="mt-2">
            <Card.Body>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
};

// ------------------------------
// MAIN COMPONENT WITH TABS
// ------------------------------
function NormalUserPassesDashboard() {
  // Tabs: 'toll', 'analysis', 'cost', 'charges'
  const [activeTab, setActiveTab] = useState('toll');

  const renderContent = () => {
    switch (activeTab) {
      case 'toll':
        return <TollStationPassesSection />;
      case 'analysis':
        return <PassAnalysisSection />;
      case 'cost':
        return <PassesCostSection />;
      case 'charges':
        return <ChargesBySection />;
      default:
        return null;
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Passes Panel</h2>
      <div className="text-center mb-4">
        <Button
          variant={activeTab === 'toll' ? "primary" : "outline-primary"}
          onClick={() => setActiveTab('toll')}
          className="me-2"
        >
          Toll Station Passes
        </Button>
        <Button
          variant={activeTab === 'analysis' ? "primary" : "outline-primary"}
          onClick={() => setActiveTab('analysis')}
          className="me-2"
        >
          Pass Analysis
        </Button>
        <Button
          variant={activeTab === 'cost' ? "primary" : "outline-primary"}
          onClick={() => setActiveTab('cost')}
          className="me-2"
        >
          Passes Cost
        </Button>
        <Button
          variant={activeTab === 'charges' ? "primary" : "outline-primary"}
          onClick={() => setActiveTab('charges')}
        >
          Charges By
        </Button>
      </div>
      {renderContent()}
    </Container>
  );
}

export default NormalUserPassesDashboard;




