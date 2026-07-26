import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const db = await getDatabase();
    
    const today = new Date().toISOString().split('T')[0];
    
    const totalPatients = await db.get('SELECT COUNT(*) as count FROM patients');
    const todayAppointments = await db.get(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = "pending"',
      [today]
    );
    const completedAppointments = await db.get(
      'SELECT COUNT(*) as count FROM appointments WHERE status = "completed"'
    );
    const pendingLabTests = await db.get(
      'SELECT COUNT(*) as count FROM laboratory_results WHERE status = "pending"'
    );
    const doctors = await db.get('SELECT COUNT(*) as count FROM doctors');
    const nurses = await db.get('SELECT COUNT(*) as count FROM nurses');
    
    // Revenue calculation (simplified)
    const medicines = await db.all(
      'SELECT SUM(price * (SELECT SUM(quantity) FROM dispensing WHERE medicine_id = medicines.id)) as revenue FROM medicines'
    );
    
    res.json({
      totalPatients: totalPatients.count,
      todayAppointments: todayAppointments.count,
      completedAppointments: completedAppointments.count,
      pendingLabTests: pendingLabTests.count,
      totalDoctors: doctors.count,
      totalNurses: nurses.count,
      revenue: medicines[0]?.revenue || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent appointments
router.get('/appointments/recent', async (req, res) => {
  try {
    const db = await getDatabase();
    const appointments = await db.all(
      'SELECT a.*, p.name as patient_name, d.name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id ORDER BY a.appointment_date DESC LIMIT 10'
    );
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments by status
router.get('/appointments/status/:status', async (req, res) => {
  try {
    const db = await getDatabase();
    const count = await db.get(
      'SELECT COUNT(*) as count FROM appointments WHERE status = ?',
      [req.params.status]
    );
    res.json({ status: req.params.status, count: count.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment trends
router.get('/trends/appointments', async (req, res) => {
  try {
    const db = await getDatabase();
    const trends = await db.all(
      `SELECT appointment_date, COUNT(*) as count, status FROM appointments GROUP BY appointment_date, status ORDER BY appointment_date DESC LIMIT 30`
    );
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medicine stock levels
router.get('/pharmacy/stock', async (req, res) => {
  try {
    const db = await getDatabase();
    const stock = await db.all(
      'SELECT m.name, SUM(ms.quantity) as total_quantity FROM medicines m LEFT JOIN medicine_stock ms ON m.id = ms.medicine_id GROUP BY m.id ORDER BY m.name'
    );
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor availability
router.get('/doctors/availability', async (req, res) => {
  try {
    const db = await getDatabase();
    const doctors = await db.all(
      'SELECT id, name, department, availability FROM doctors ORDER BY department, name'
    );
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patients by department
router.get('/patients/by-department', async (req, res) => {
  try {
    const db = await getDatabase();
    const departments = await db.all(
      `SELECT d.department, COUNT(a.patient_id) as patient_count
       FROM doctors d
       LEFT JOIN appointments a ON d.id = a.doctor_id
       GROUP BY d.department
       ORDER BY patient_count DESC`
    );
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lab test distribution
router.get('/lab/distribution', async (req, res) => {
  try {
    const db = await getDatabase();
    const distribution = await db.all(
      'SELECT test_name, COUNT(*) as count FROM laboratory_results GROUP BY test_name ORDER BY count DESC'
    );
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;