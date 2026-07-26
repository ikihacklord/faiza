import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all nurses
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const nurses = await db.all('SELECT * FROM nurses ORDER BY name');
    res.json(nurses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nurse by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const nurse = await db.get('SELECT * FROM nurses WHERE id = ?', [req.params.id]);
    if (!nurse) return res.status(404).json({ error: 'Nurse not found' });
    res.json(nurse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create nurse
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, email, phone, department, shift, availability, license_number } = req.body;
    
    await db.run(
      `INSERT INTO nurses (name, email, phone, department, shift, availability, license_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, department, shift, availability, license_number]
    );
    
    const nurse = await db.get('SELECT * FROM nurses WHERE email = ?', [email]);
    res.status(201).json(nurse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update nurse
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, email, phone, department, shift, availability } = req.body;
    
    await db.run(
      `UPDATE nurses SET name = ?, email = ?, phone = ?, department = ?, shift = ?, availability = ?
       WHERE id = ?`,
      [name, email, phone, department, shift, availability, req.params.id]
    );
    
    const nurse = await db.get('SELECT * FROM nurses WHERE id = ?', [req.params.id]);
    res.json(nurse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete nurse
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM nurses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;