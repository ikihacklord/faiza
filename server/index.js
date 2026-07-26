import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeDatabase } from './database/init.js';
import { seedDatabase } from './database/seed.js';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctors.js';
import nurseRoutes from './routes/nurses.js';
import appointmentRoutes from './routes/appointments.js';
import laboratoryRoutes from './routes/laboratory.js';
import pharmacyRoutes from './routes/pharmacy.js';
import medicalRecordRoutes from './routes/medicalRecords.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client/build')));

// Initialize database
try {
  await initializeDatabase();
  console.log('✓ Database initialized');
  
  // Seed database if empty
  await seedDatabase();
  console.log('✓ Database seeded with demo data');
} catch (error) {
  console.error('Database initialization error:', error);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/nurses', nurseRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/laboratory', laboratoryRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🏥 Sunrise HRMS Server running on http://localhost:${PORT}`);
});