import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all medicines
router.get('/medicines', async (req, res) => {
  try {
    const db = await getDatabase();
    const medicines = await db.all('SELECT * FROM medicines ORDER BY name');
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medicine stock
router.get('/stock', async (req, res) => {
  try {
    const db = await getDatabase();
    const stock = await db.all(
      'SELECT ms.*, m.name, m.price FROM medicine_stock ms JOIN medicines m ON ms.medicine_id = m.id ORDER BY m.name'
    );
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock for medicine
router.get('/stock/:medicine_id', async (req, res) => {
  try {
    const db = await getDatabase();
    const stock = await db.all(
      'SELECT * FROM medicine_stock WHERE medicine_id = ? ORDER BY expiry_date',
      [req.params.medicine_id]
    );
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add medicine
router.post('/medicines', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, description, price, strength, unit, manufacturer } = req.body;
    
    await db.run(
      `INSERT INTO medicines (name, description, price, strength, unit, manufacturer)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, strength, unit, manufacturer]
    );
    
    const medicine = await db.get('SELECT * FROM medicines WHERE name = ?', [name]);
    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add stock
router.post('/stock', async (req, res) => {
  try {
    const db = await getDatabase();
    const { medicine_id, batch_number, quantity, expiry_date, purchase_date, cost_price } = req.body;
    
    await db.run(
      `INSERT INTO medicine_stock (medicine_id, batch_number, quantity, expiry_date, purchase_date, cost_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [medicine_id, batch_number, quantity, expiry_date, purchase_date, cost_price]
    );
    
    const stock = await db.get('SELECT * FROM medicine_stock WHERE id = last_insert_rowid()');
    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dispense medicine
router.post('/dispense', async (req, res) => {
  try {
    const db = await getDatabase();
    const { patient_id, medicine_id, quantity, nurse_id, notes } = req.body;
    
    // Record dispensing
    await db.run(
      `INSERT INTO dispensing (patient_id, medicine_id, quantity, dispensing_date, nurse_id, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, medicine_id, quantity, new Date().toISOString().split('T')[0], nurse_id, notes]
    );
    
    // Update stock
    const stock = await db.get('SELECT * FROM medicine_stock WHERE medicine_id = ? ORDER BY quantity DESC LIMIT 1', [medicine_id]);
    if (stock) {
      await db.run(
        'UPDATE medicine_stock SET quantity = quantity - ? WHERE id = ?',
        [quantity, stock.id]
      );
    }
    
    const dispensing = await db.get('SELECT * FROM dispensing WHERE id = last_insert_rowid()');
    res.status(201).json(dispensing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock quantity
router.put('/stock/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { quantity, expiry_date } = req.body;
    
    await db.run(
      `UPDATE medicine_stock SET quantity = ?, expiry_date = ? WHERE id = ?`,
      [quantity, expiry_date, req.params.id]
    );
    
    const stock = await db.get('SELECT * FROM medicine_stock WHERE id = ?', [req.params.id]);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete stock
router.delete('/stock/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM medicine_stock WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;