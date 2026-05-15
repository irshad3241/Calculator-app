const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('combined'));

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'calculator_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
});

// Init DB table
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        expression VARCHAR(255) NOT NULL,
        result NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  }
}

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Calculate endpoint
app.post('/api/calculate', async (req, res) => {
  const { expression } = req.body;

  if (!expression || typeof expression !== 'string') {
    return res.status(400).json({ error: 'Invalid expression' });
  }

  // Sanitize - only allow safe math characters
  const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
  if (!sanitized) {
    return res.status(400).json({ error: 'Expression contains invalid characters' });
  }

  try {
    // Safe evaluation using Function (sandboxed)
    const result = Function('"use strict"; return (' + sanitized + ')')();

    if (!isFinite(result)) {
      return res.status(400).json({ error: 'Invalid mathematical operation' });
    }

    // Store in DB
    const { rows } = await pool.query(
      'INSERT INTO calculations (expression, result) VALUES ($1, $2) RETURNING *',
      [expression, result]
    );

    res.json({ id: rows[0].id, expression, result, timestamp: rows[0].created_at });
  } catch (err) {
    res.status(400).json({ error: 'Invalid expression: ' + err.message });
  }
});

// Get history
app.get('/api/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { rows } = await pool.query(
      'SELECT * FROM calculations ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear history
app.delete('/api/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM calculations');
    res.json({ message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
  });
});

module.exports = app;
