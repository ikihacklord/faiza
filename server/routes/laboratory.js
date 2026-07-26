import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all lab results
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    const results = await db.all(
      'SELECT l.*, p.name as patient_name FROM laboratory_results l JOIN patients p ON l.patient_id = p.id ORDER BY l.result_date DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const total = await db.get('SELECT COUNT(*) as count FROM laboratory_results');
    
    res.json({ results, total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lab results for patient
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const db = await getDatabase();
    const results = await db.all(
      'SELECT * FROM laboratory_results WHERE patient_id = ? ORDER BY result_date DESC',
      [req.params.patient_id]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lab result
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { patient_id, test_name, test_category, result, reference_range, lab_notes } = req.body;
    
    await db.run(
      `INSERT INTO laboratory_results (patient_id, test_name, test_category, result, result_date, reference_range, lab_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, test_name, test_category, result, new Date().toISOString().split('T')[0], reference_range, lab_notes, 'completed']
    );
    
    const labResult = await db.get('SELECT * FROM laboratory_results WHERE id = last_insert_rowid()');
    res.status(201).json(labResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lab result
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { test_name, result, reference_range, lab_notes, status } = req.body;
    
    await db.run(
      `UPDATE laboratory_results SET test_name = ?, result = ?, reference_range = ?, lab_notes = ?, status = ?
       WHERE id = ?`,
      [test_name, result, reference_range, lab_notes, status, req.params.id]
    );
    
    const labResult = await db.get('SELECT * FROM laboratory_results WHERE id = ?', [req.params.id]);
    res.json(labResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lab result
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM laboratory_results WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;