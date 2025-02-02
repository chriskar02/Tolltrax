import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';

const NavigationBar = ({ isAdmin, handleLogout }) => {
    return (
        <Navbar bg="light" expand="lg" sticky="top">
            <Container>
                <Navbar.Brand href="/">TollTrax</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto">
                        <Nav.Link href="/">Home</Nav.Link>
                        {isAdmin && <Nav.Link href="/admin">Admin</Nav.Link>}
                        <Nav.Link href="/usercase1">User Case 1</Nav.Link>
                        <Nav.Link href="/usercase2">User Case 2</Nav.Link>
                        <Nav.Link href="/usercase3">User Case 3</Nav.Link>
                        <button className="btn btn-danger ms-3" onClick={handleLogout}>Logout</button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
