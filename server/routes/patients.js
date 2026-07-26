import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { search, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM patients';
    const params = [];
    
    if (search) {
      query += ' WHERE name LIKE ? OR mrn LIKE ? OR national_id LIKE ? OR phone LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    const patients = await db.all(query, params);
    const total = await db.get(`SELECT COUNT(*) as count FROM patients`);
    
    res.json({ patients, total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create patient
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, age, gender, phone, email, county, national_id, blood_group, allergy, insurance_provider, next_of_kin, emergency_contact } = req.body;
    
    const mrn = 'MRN' + String(Math.floor(Math.random() * 999999)).padStart(6, '0');
    
    await db.run(
      `INSERT INTO patients (name, age, gender, phone, email, county, national_id, mrn, blood_group, allergy, insurance_provider, next_of_kin, emergency_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, age, gender, phone, email, county, national_id, mrn, blood_group, allergy, insurance_provider, next_of_kin, emergency_contact]
    );
    
    const newPatient = await db.get('SELECT * FROM patients WHERE national_id = ?', [national_id]);
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, age, gender, phone, email, county, blood_group, allergy, insurance_provider, next_of_kin, emergency_contact } = req.body;
    
    await db.run(
      `UPDATE patients SET name = ?, age = ?, gender = ?, phone = ?, email = ?, county = ?, blood_group = ?, allergy = ?, insurance_provider = ?, next_of_kin = ?, emergency_contact = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, age, gender, phone, email, county, blood_group, allergy, insurance_provider, next_of_kin, emergency_contact, req.params.id]
    );
    
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;