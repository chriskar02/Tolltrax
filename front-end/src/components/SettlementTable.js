import React from 'react';
import { Table } from 'react-bootstrap';

const SettlementTable = ({ settlements }) => {
    return (
        <Table striped bordered hover responsive className="mt-3">
            <thead>
                <tr>
                    <th>Operator</th>
                    <th style={{ textAlign: "center" }}>Total Settlement (€)</th>
                </tr>
            </thead>
            <tbody>
                {settlements.length > 0 ? (
                    settlements.map((settlement, index) => (
                        <tr key={index}>
                            <td style={{ textAlign: "center" }}>{settlement.other_operator}</td>
                            <td
                                style={{
                                    textAlign: "center",  // Center-align settlement amount
                                    color: settlement.total_settlement < 0 ? "red" : "green"
                                }}
                            >
                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(settlement.total_settlement)}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="text-center">No settlements found</td>
                    </tr>
                )}
            </tbody>
        </Table>
    );
};

export default SettlementTable;
