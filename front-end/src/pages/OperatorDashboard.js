import React, { useState } from 'react';
import { Container, Button, Form, Card, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const OperatorDashboard = ({ user, setIsAuthenticated }) => {
    const navigate = useNavigate();

    // Settlement-related state
    const [otherOperatorId, setOtherOperatorId] = useState("");
    const [settlement, setSettlement] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        navigate('/');
    };

    const handleSettlement = () => {
        if (!otherOperatorId.trim()) {
            setError("Please provide a valid operator ID.");
            return;
        }
        setLoading(true);
        setError(null);
        setSettlement(null);

        // Simulate an API call to retrieve settlement details.
        setTimeout(() => {
            const dummySettlement = `Settlement between operator ${user.username} and operator ${otherOperatorId} is $1000 (dummy result).`;
            setSettlement(dummySettlement);
            setLoading(false);
        }, 1500);
    };

    return (
        <Container className="mt-5 text-center">
            <h1>Welcome, {user.username}</h1>

            {/* Settlement Calculator Section */}
            <Card className="my-4">
                <Card.Body>
                    <Card.Title>Settlement Calculator</Card.Title>
                    <Form>
                        <Form.Group controlId="otherOperatorId">
                            <Form.Label>Enter Other Operator ID</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Other Operator ID"
                                value={otherOperatorId}
                                onChange={(e) => setOtherOperatorId(e.target.value)}
                            />
                        </Form.Group>
                        <Button
                            variant="primary"
                            onClick={handleSettlement}
                            className="mt-2"
                            disabled={loading}
                        >
                            {loading ? <Spinner animation="border" size="sm" /> : "Get Settlement"}
                        </Button>
                    </Form>
                    {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
                    {settlement && (
                        <Card className="mt-3">
                            <Card.Body>
                                <Card.Text>{settlement}</Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Card.Body>
            </Card>

            <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </Container>
    );
};

export default OperatorDashboard;
