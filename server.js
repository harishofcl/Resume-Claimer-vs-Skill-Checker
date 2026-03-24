const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// Database Setup
const dbPath = path.join(__dirname, 'proctorai.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      score INTEGER NOT NULL,
      status TEXT NOT NULL,
      skills TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// API Routes

// 1. Save Candidate Assessment
app.post('/api/candidates', (req, res) => {
  const { name, email, role, score, status, skills } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const query = `INSERT INTO candidates (name, email, role, score, status, skills) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(query, [name, email, role, score, status, skills], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to save candidate' });
    }
    res.status(201).json({ message: 'Candidate saved successfully', id: this.lastID });
  });
});

// 2. Get All Candidates
app.get('/api/candidates', (req, res) => {
  const query = `SELECT * FROM candidates ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to fetch candidates' });
    }
    res.json(rows);
  });
});

// 3. Clear Database
app.delete('/api/candidates', (req, res) => {
  const query = `DELETE FROM candidates`;
  db.run(query, [], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to clear database' });
    }
    res.json({ message: 'Database cleared successfully', changes: this.changes });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
