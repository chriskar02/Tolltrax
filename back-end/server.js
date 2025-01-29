const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Tollway System API');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const adminRoutes = require('./routes/admin');
app.use('/api', adminRoutes);
