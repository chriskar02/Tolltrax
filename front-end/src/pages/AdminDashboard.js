// src/pages/AdminDashboard.js
import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Form,
  Table,
} from "react-bootstrap";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components for the Analysis Panel
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminDashboard({ user }) {
  // Panel selector state: "", "admin", "passes", or "analysis"
  // Default is empty so that no panel content is shown initially.
  const [activePanel, setActivePanel] = useState("");

  // ----------------------------------------
  // ADMIN PANEL FUNCTIONALITIES & STATES
  // ----------------------------------------
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
        setMessage(
          typeof successMessage === "function"
            ? successMessage(response)
            : successMessage
        );
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

  // ----------------------------------------
  // PASSES PANEL FUNCTIONALITIES & STATES
  // ----------------------------------------
  const token = localStorage.getItem("authToken");

  // Toll Station Passes
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
        { headers: { "x-observatory-auth": token } }
      );
      setTsResult(response.data);
    } catch (err) {
      setTsError(err.response?.data?.info || err.message);
    } finally {
      setTsLoading(false);
    }
  };

  // Pass Analysis
  const [paStationOpID, setPaStationOpID] = useState("");
  const [paTagOpID, setPaTagOpID] = useState("");
  const [paDateFrom, setPaDateFrom] = useState("");
  const [paDateTo, setPaDateTo] = useState("");
  const [paResult, setPaResult] = useState(null);
  const [paError, setPaError] = useState(null);
  const [paLoading, setPaLoading] = useState(false);

  const getPassAnalysis = async () => {
    setPaLoading(true);
    setPaError(null);
    setPaResult(null);
    try {
      const response = await axios.get(
        `http://localhost:9115/api/passAnalysis/${paStationOpID}/${paTagOpID}/${paDateFrom}/${paDateTo}`,
        { headers: { "x-observatory-auth": token } }
      );
      setPaResult(response.data);
    } catch (err) {
      setPaError(err.response?.data?.info || err.message);
    } finally {
      setPaLoading(false);
    }
  };

  // Passes Cost
  const [pcTollOpID, setPcTollOpID] = useState("");
  const [pcTagOpID, setPcTagOpID] = useState("");
  const [pcDateFrom, setPcDateFrom] = useState("");
  const [pcDateTo, setPcDateTo] = useState("");
  const [pcResult, setPcResult] = useState(null);
  const [pcError, setPcError] = useState(null);
  const [pcLoading, setPcLoading] = useState(false);

  const getPassesCost = async () => {
    setPcLoading(true);
    setPcError(null);
    setPcResult(null);
    try {
      const response = await axios.get(
        `http://localhost:9115/api/passesCost/${pcTollOpID}/${pcTagOpID}/${pcDateFrom}/${pcDateTo}`,
        { headers: { "x-observatory-auth": token } }
      );
      setPcResult(response.data);
    } catch (err) {
      setPcError(err.response?.data?.info || err.message);
    } finally {
      setPcLoading(false);
    }
  };

  // Charges By
  const [cbTollOpID, setCbTollOpID] = useState("");
  const [cbDateFrom, setCbDateFrom] = useState("");
  const [cbDateTo, setCbDateTo] = useState("");
  const [cbResult, setCbResult] = useState(null);
  const [cbError, setCbError] = useState(null);
  const [cbLoading, setCbLoading] = useState(false);

  const getChargesBy = async () => {
    setCbLoading(true);
    setCbError(null);
    setCbResult(null);
    try {
      const response = await axios.get(
        `http://localhost:9115/api/chargesBy/${cbTollOpID}/${cbDateFrom}/${cbDateTo}`,
        { headers: { "x-observatory-auth": token } }
      );
      setCbResult(response.data);
    } catch (err) {
      setCbError(err.response?.data?.info || err.message);
    } finally {
      setCbLoading(false);
    }
  };

  // ----------------------------------------
  // ANALYSIS PANEL FUNCTIONALITIES & STATES
  // ----------------------------------------
  const [analysisStationData, setAnalysisStationData] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const handleFetchStationPopularity = async () => {
    setAnalysisLoading(true);
    setAnalysisError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:9115/api/admin/station-popularity",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-observatory-auth": `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setAnalysisStationData(data);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const chartData = {
    labels: analysisStationData.map((item) => item.station_name),
    datasets: [
      {
        label: "Passthrough Count",
        data: analysisStationData.map((item) => Number(item.passthrough_count)),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        categoryPercentage: 0.8,
        barPercentage: 0.7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    indexAxis: "y", // horizontal bar chart
    scales: {
      y: {
        ticks: { display: false },
      },
    },
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Station Popularity" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const stationName = context.label;
            const count = context.parsed.x;
            return `${stationName}: ${count}`;
          },
        },
      },
    },
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center mb-4">Welcome, {user.username}</h1>

      {/* Panel Selector Buttons */}
      <Row className="mb-4 justify-content-center">
        <Col md="auto">
          <Button
            variant={activePanel === "admin" ? "primary" : "outline-primary"}
            onClick={() => setActivePanel("admin")}
          >
            Admin Panel
          </Button>
        </Col>
        <Col md="auto">
          <Button
            variant={activePanel === "passes" ? "primary" : "outline-primary"}
            onClick={() => setActivePanel("passes")}
          >
            Passes Panel
          </Button>
        </Col>
        <Col md="auto">
          <Button
            variant={activePanel === "analysis" ? "primary" : "outline-primary"}
            onClick={() => setActivePanel("analysis")}
          >
            Analysis Panel
          </Button>
        </Col>
      </Row>

      {/* If no panel is selected, nothing else is shown */}
      {activePanel === "" && (
        <Row className="justify-content-center">
          <Col md="auto">
            <p className="text-center">Please select a panel.</p>
          </Col>
        </Row>
      )}

      {/* ------------------- */}
      {/* ADMIN PANEL */}
      {/* ------------------- */}
      {activePanel === "admin" && (
        <>
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
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    action.name
                  )}
                </Button>
              </Col>
            ))}
          </Row>
          {message && (
            <Alert
              variant={message.includes("Error") ? "danger" : "success"}
              onClose={() => setMessage(null)}
              dismissible
              className="text-center"
            >
              {message}
            </Alert>
          )}
          {healthData && (
            <Card className="mt-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">System Health Details</h2>
                <Button variant="light" size="sm" onClick={() => setHealthData(null)}>
                  Hide
                </Button>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p>
                      <strong>Database Connection:</strong>{" "}
                      {healthData.dbconnection}
                    </p>
                    <p>
                      <strong>Number of Stations:</strong>{" "}
                      {healthData.n_stations}
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
        </>
      )}

      {/* ------------------- */}
      {/* PASSES PANEL */}
      {/* ------------------- */}
      {activePanel === "passes" && (
        <>
          <h2 className="text-center mb-4">Passes Panel</h2>

          {/* Toll Station Passes */}
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
              <Button
                variant="primary"
                onClick={getTollStationPasses}
                className="mt-2"
              >
                Get Toll Station Passes
              </Button>
              {tsLoading && <Spinner animation="border" className="mt-2" />}
              {tsError && (
                <Alert
                  variant="danger"
                  className="mt-2"
                  onClose={() => setTsError(null)}
                  dismissible
                >
                  {tsError}
                </Alert>
              )}
              {tsResult && (
                <>
                  <Card className="mt-2">
                    <Card.Body>
                      <pre>{JSON.stringify(tsResult, null, 2)}</pre>
                    </Card.Body>
                  </Card>
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setTsResult(null)}
                  >
                    Hide Result
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Pass Analysis */}
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
              <Button
                variant="secondary"
                onClick={getPassAnalysis}
                className="mt-2"
              >
                Get Pass Analysis
              </Button>
              {paLoading && <Spinner animation="border" className="mt-2" />}
              {paError && (
                <Alert
                  variant="danger"
                  className="mt-2"
                  onClose={() => setPaError(null)}
                  dismissible
                >
                  {paError}
                </Alert>
              )}
              {paResult && (
                <>
                  <Card className="mt-2">
                    <Card.Body>
                      <pre>{JSON.stringify(paResult, null, 2)}</pre>
                    </Card.Body>
                  </Card>
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setPaResult(null)}
                  >
                    Hide Result
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Passes Cost */}
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
              <Button
                variant="success"
                onClick={getPassesCost}
                className="mt-2"
              >
                Get Passes Cost
              </Button>
              {pcLoading && <Spinner animation="border" className="mt-2" />}
              {pcError && (
                <Alert
                  variant="danger"
                  className="mt-2"
                  onClose={() => setPcError(null)}
                  dismissible
                >
                  {pcError}
                </Alert>
              )}
              {pcResult && (
                <>
                  <Card className="mt-2">
                    <Card.Body>
                      <pre>{JSON.stringify(pcResult, null, 2)}</pre>
                    </Card.Body>
                  </Card>
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setPcResult(null)}
                  >
                    Hide Result
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Charges By */}
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
              {cbError && (
                <Alert
                  variant="danger"
                  className="mt-2"
                  onClose={() => setCbError(null)}
                  dismissible
                >
                  {cbError}
                </Alert>
              )}
              {cbResult && (
                <>
                  <Card className="mt-2">
                    <Card.Body>
                      <pre>{JSON.stringify(cbResult, null, 2)}</pre>
                    </Card.Body>
                  </Card>
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setCbResult(null)}
                  >
                    Hide Result
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* ------------------- */}
      {/* ANALYSIS PANEL */}
      {/* ------------------- */}
      {activePanel === "analysis" && (
        <>
          <h2 className="text-center mb-4">Analysis Panel</h2>
          <Card className="mb-4">
            <Card.Header>Station Popularity Analysis</Card.Header>
            <Card.Body className="text-center">
              <Button
                variant="primary"
                onClick={handleFetchStationPopularity}
                disabled={analysisLoading}
              >
                {analysisLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Load Station Popularity"
                )}
              </Button>
              {analysisError && (
                <Alert
                  variant="danger"
                  className="mt-2"
                  onClose={() => setAnalysisError("")}
                  dismissible
                >
                  {analysisError}
                </Alert>
              )}
              {analysisStationData.length > 0 && (
                <>
                  <div className="mt-4">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                  <Table striped bordered hover className="mt-4">
                    <thead>
                      <tr>
                        <th>Station Name</th>
                        <th>Passthrough Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisStationData.map((station, index) => (
                        <tr key={index}>
                          <td>{station.station_name}</td>
                          <td>{station.passthrough_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setAnalysisStationData([])}
                  >
                    Hide Result
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
}

export default AdminDashboard;

