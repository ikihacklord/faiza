import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const doctors = await db.all('SELECT * FROM doctors ORDER BY name');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctors by department
router.get('/department/:dept', async (req, res) => {
  try {
    const db = await getDatabase();
    const doctors = await db.all('SELECT * FROM doctors WHERE department = ? ORDER BY name', [req.params.dept]);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create doctor
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, email, phone, department, qualification, license_number, availability } = req.body;
    
    await db.run(
      `INSERT INTO doctors (name, email, phone, department, qualification, license_number, availability, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, department, qualification, license_number, availability, 'https://via.placeholder.com/200']
    );
    
    const doctor = await db.get('SELECT * FROM doctors WHERE email = ?', [email]);
    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update doctor
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, email, phone, department, qualification, license_number, availability } = req.body;
    
    await db.run(
      `UPDATE doctors SET name = ?, email = ?, phone = ?, department = ?, qualification = ?, license_number = ?, availability = ?
       WHERE id = ?`,
      [name, email, phone, department, qualification, license_number, availability, req.params.id]
    );
    
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;