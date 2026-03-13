/**
 * Minimal Express app for SpecFormula E2E verification.
 * Self-contained — no dependency on production index.ts.
 *
 * Endpoints:
 *   POST /api/notes  → 建立筆記
 *   GET  /api/notes/:id → 取得筆記
 */
import express from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

// Use the same pool as specformula (injected at setup time)
let pool: Pool;

export function setPool(p: Pool): void {
  pool = p;
}

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const result = await pool.query(
      'INSERT INTO test_notes (title, content, author) VALUES ($1, $2, $3) RETURNING *',
      [title, content || null, author || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM test_notes WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export { app };
