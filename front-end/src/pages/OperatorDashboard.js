import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Spinner, Alert, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SettlementTable from '../components/SettlementTable'; // Import the new table component

const OperatorDashboard = ({ user, setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [settlements, setSettlements] = useState([]); // Stores settlement data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSettlements = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch("http://localhost:9115/api/settlements", {
                    method: "GET",
                    headers: { 'X-OBSERVATORY-AUTH': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("Failed to fetch settlements.");
                const data = await response.json();
                setSettlements(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSettlements();
    }, []); // Fetch settlements when component mounts

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        navigate('/');
    };

    return (
        <Container className="mt-5 text-center">
            <h1>Welcome, {user.username}</h1>

            <Card className="my-4">
                <Card.Body>
                    <Card.Title>Debt Settlements</Card.Title>
                    {loading ? (
                        <Spinner animation="border" />
                    ) : error ? (
                        <Alert variant="danger">{error}</Alert>
                    ) : (
                        <SettlementTable settlements={settlements} />
                    )}
                </Card.Body>
            </Card>

            <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </Container>
    );
};

export default OperatorDashboard;
