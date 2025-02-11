require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./routes/db"); // Import initializeDatabase

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());



// Initialize the database before starting the server
initializeDatabase()
  .then(() => {
    console.log("Database initialized successfully.");

    // Register routes only after DB initialization
    const { router: authRoutes } = require("./routes/auth");
    app.use("/api", authRoutes);

    const passesRoutes = require("./routes/passes");
    app.use("/api", passesRoutes);

    const adminRoutes = require("./routes/admin");
    app.use("/api", adminRoutes);

    const analyticsRoutes = require("./routes/analytics");
    app.use("/api", analyticsRoutes);

    // Catch-all route for debugging
    app.use("*", (req, res) => {
      console.log(`Received request for ${req.originalUrl}`);
      res.status(404).json({ error: "Route not found" });
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
  });

module.exports = app;
