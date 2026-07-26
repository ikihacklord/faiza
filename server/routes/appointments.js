import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT a.*, p.name as patient_name, d.name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id';
    const params = [];
    
    if (status) {
      query += ' WHERE a.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    const appointments = await db.all(query, params);
    const total = await db.get('SELECT COUNT(*) as count FROM appointments');
    
    res.json({ appointments, total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const appointment = await db.get(
      'SELECT a.*, p.name as patient_name, d.name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id WHERE a.id = ?',
      [req.params.id]
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create appointment
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { patient_id, doctor_id, appointment_date, appointment_time, reason, notes } = req.body;
    
    await db.run(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, appointment_date, appointment_time, reason, notes]
    );
    
    const appointment = await db.get(
      'SELECT a.*, p.name as patient_name, d.name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id WHERE a.id = last_insert_rowid()'
    );
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { appointment_date, appointment_time, reason, status, notes } = req.body;
    
    await db.run(
      `UPDATE appointments SET appointment_date = ?, appointment_time = ?, reason = ?, status = ?, notes = ?
       WHERE id = ?`,
      [appointment_date, appointment_time, reason, status, notes, req.params.id]
    );
    
    const appointment = await db.get(
      'SELECT a.*, p.name as patient_name, d.name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id WHERE a.id = ?',
      [req.params.id]
    );
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const db = await getDatabase();
    const { status } = req.body;
    
    await db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    
    const appointment = await db.get(
      'SELECT a.*, p.name as patient_name, d.name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id WHERE a.id = ?',
      [req.params.id]
    );
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;