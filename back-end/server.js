const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT;

app.get('/', (req, res) => {
  res.send('Tollway System API');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

