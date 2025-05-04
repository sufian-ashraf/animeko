const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize the Express app
const app = express();

// Enable CORS for all requests (or restrict it to your frontend URL)
app.use(cors());  // This enables CORS for all origins
// Or, to allow only from localhost:3000 (for development):
// app.use(cors({ origin: 'http://localhost:3000' }));

// Parse JSON bodies
app.use(express.json());

// PostgreSQL database setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.connect()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error', err));

// Test query to check if the connection is working
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error', err);
  else console.log('Connected to PostgreSQL at', res.rows[0].now);
});

// Example API route
app.get('/api/anime', (req, res) => {
  // Example of how you could fetch anime data from your database
  pool.query('SELECT * FROM anime', (err, result) => {
    if (err) {
      console.error('Error fetching anime data', err);
      return res.status(500).send('Error fetching anime data');
    }
    res.json(result.rows);
  });
});

// Set the server to listen on port 5000 (or your preferred port)
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
