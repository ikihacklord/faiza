import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Login/Register
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Only @gmail.com emails accepted for demo' });
    }
    
    const db = await getDatabase();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      // Create new user
      await db.run(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, password, role || 'admin']
      );
      user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    
    const db = await getDatabase();
    const user = await db.get('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

export default router;