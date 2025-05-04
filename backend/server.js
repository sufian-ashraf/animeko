const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

// Middleware
const corsOptions = {
  origin: "http://localhost:3000", // Allow only React app
  methods: "GET,POST" // Allow only needed methods
};
app.use(cors(corsOptions));
app.use(express.json());

// Mock database (replace with real PostgreSQL later)
let animeList = [
  { id: 1, title: "Attack on Titan", episodes: 75, rating: 9.0 },
  { id: 2, title: "Demon Slayer", episodes: 44, rating: 8.8 },
  { id: 3, title: "Jujutsu Kaisen", episodes: 24, rating: 8.7 }
];

// Routes
app.get('/api/anime', (req, res) => {
  res.json(animeList);
});
// In backend/server.js
app.post('/api/anime', (req, res) => {
  const newAnime = {
    id: animeList.length + 1, // Simple ID generation
    ...req.body
  };
  animeList.push(newAnime);
  res.status(201).json(newAnime); // 201 Created status
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));