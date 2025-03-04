const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool } = require("./db");
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;

//Support for application/x-www-form-urlencoded
router.use(express.urlencoded({ extended: true }));

// User Login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: "failed", info: "Username and password required" });
    }

    try {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM "user" WHERE username = $1`, [username]);

        if (result.rowCount === 0) {
            return res.status(401).json({ status: "failed", info: "Invalid username or password" });
        }

        const user = result.rows[0];

        // Compare hashed password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ status: "failed", info: "Invalid username or password" });
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
        return res.status(500).json({ status: "failed", info: "Internal server error" });
    }
});


// Verify Token
router.get("/verify-token", (req, res) => {
    const token = req.headers['x-observatory-auth'];

    if (!token) {
        return res.status(401).json({ error: "Authentication token required" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).json({ error: "Invalid or expired token" });
        }
        return res.json({ message: "Token is valid", user: decoded });
    });
});

// Logout
router.post("/logout", (req, res) => {
    const token = req.headers['x-observatory-auth'];
    if (!token) {
        return res.status(401).json({ error: "Authentication token required" });
    }
    return res.sendStatus(200);
});


//Middleware auth functions

function authenticateToken(req, res, next) {
    const token = req.headers['x-observatory-auth'];
    console.log("Received token:", token);
    if (!token) {
        return res.status(401).json({ error: "Authentication token required" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).json({ error: "Invalid or expired token" });
        }
        req.user = decoded; // decoded token should include at least username and type
        next();
    });
}

//Anyone that isn't normal, analyst or admin is operator
function isOperator(userType) {
    return !["admin", "analyst", "normal"].includes(userType);
}

// Middleware to check user roles
// If allowedRoles includes "operator", then any user whose type qualifies as an operator will pass.
function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied" });
        }
        const userType = req.user.type;
        // Check if "operator" is allowed and the user is an operator based on their type.
        if (allowedRoles.includes("operator") && isOperator(userType)) {
            return next();
        }
        // Otherwise, check if the user's type exactly matches one of the allowed roles.
        if (allowedRoles.includes(userType)) {
            return next();
        }
        return res.status(401).json({ error: "Access denied" });
    };
}

module.exports = { router, authenticateToken, checkRole };
