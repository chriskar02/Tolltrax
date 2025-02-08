const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool } = require("./db");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// User Login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM "user" WHERE username = $1`, [username]);

        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const user = result.rows[0];

        // Compare hashed password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { username: user.username, type: user.type },
            SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRATION || "2h" }
        );

        return res.json({ token });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Verify Token
router.get("/verify-token", (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Authentication token required" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        return res.json({ message: "Token is valid", user: decoded });
    });
});

// Logout (Handled client-side)
router.post("/logout", (req, res) => {
    return res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
