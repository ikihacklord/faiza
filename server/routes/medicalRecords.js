import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all medical records
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { patient_id, page = 1, limit = 20 } = req.query;
    let query = 'SELECT m.*, p.name as patient_name, d.name as doctor_name FROM medical_records m JOIN patients p ON m.patient_id = p.id LEFT JOIN doctors d ON m.doctor_id = d.id';
    const params = [];
    
    if (patient_id) {
      query += ' WHERE m.patient_id = ?';
      params.push(patient_id);
    }
    
    query += ' ORDER BY m.consultation_date DESC';
    
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    const records = await db.all(query, params);
    const total = await db.get('SELECT COUNT(*) as count FROM medical_records');
    
    res.json({ records, total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medical record by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const record = await db.get(
      'SELECT m.*, p.name as patient_name, d.name as doctor_name FROM medical_records m JOIN patients p ON m.patient_id = p.id LEFT JOIN doctors d ON m.doctor_id = d.id WHERE m.id = ?',
      [req.params.id]
    );
    if (!record) return res.status(404).json({ error: 'Medical record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create medical record
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { patient_id, doctor_id, chief_complaint, diagnosis, prescription, notes, weight, height, temperature, blood_pressure, pulse, follow_up_date } = req.body;
    
    await db.run(
      `INSERT INTO medical_records (patient_id, doctor_id, consultation_date, chief_complaint, diagnosis, prescription, notes, weight, height, temperature, blood_pressure, pulse, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, new Date().toISOString().split('T')[0], chief_complaint, diagnosis, prescription, notes, weight, height, temperature, blood_pressure, pulse, follow_up_date]
    );
    
    const record = await db.get('SELECT * FROM medical_records WHERE id = last_insert_rowid()');
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medical record
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { chief_complaint, diagnosis, prescription, notes, weight, height, temperature, blood_pressure, pulse, follow_up_date } = req.body;
    
    await db.run(
      `UPDATE medical_records SET chief_complaint = ?, diagnosis = ?, prescription = ?, notes = ?, weight = ?, height = ?, temperature = ?, blood_pressure = ?, pulse = ?, follow_up_date = ?
       WHERE id = ?`,
      [chief_complaint, diagnosis, prescription, notes, weight, height, temperature, blood_pressure, pulse, follow_up_date, req.params.id]
    );
    
    const record = await db.get('SELECT * FROM medical_records WHERE id = ?', [req.params.id]);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete medical record
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM medical_records WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;