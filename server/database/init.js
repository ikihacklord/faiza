import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

export async function getDatabase() {
  if (db) return db;
  
  db = await open({
    filename: './hospital.db',
    driver: sqlite3.Database
  });
  
  return db;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Patients table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      phone TEXT,
      email TEXT,
      county TEXT,
      national_id TEXT UNIQUE,
      mrn TEXT UNIQUE,
      blood_group TEXT,
      allergy TEXT,
      insurance_provider TEXT,
      next_of_kin TEXT,
      emergency_contact TEXT,
      date_of_birth TEXT,
      address TEXT,
      occupation TEXT,
      marital_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Doctors table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      department TEXT,
      qualification TEXT,
      license_number TEXT,
      availability TEXT,
      photo_url TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Nurses table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS nurses (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      department TEXT,
      shift TEXT,
      availability TEXT,
      license_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Appointments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date TEXT,
      appointment_time TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    )
  `);
  
  // Medical Records table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER,
      consultation_date TEXT,
      chief_complaint TEXT,
      diagnosis TEXT,
      prescription TEXT,
      notes TEXT,
      weight REAL,
      height REAL,
      temperature REAL,
      blood_pressure TEXT,
      pulse INTEGER,
      follow_up_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    )
  `);
  
  // Laboratory Results table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS laboratory_results (
      id INTEGER PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      test_name TEXT,
      test_category TEXT,
      result TEXT,
      result_date TEXT,
      reference_range TEXT,
      lab_notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
  `);
  
  // Pharmacy - Medicines table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL,
      strength TEXT,
      unit TEXT,
      manufacturer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Pharmacy - Stock table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS medicine_stock (
      id INTEGER PRIMARY KEY,
      medicine_id INTEGER NOT NULL,
      batch_number TEXT,
      quantity INTEGER,
      expiry_date TEXT,
      purchase_date TEXT,
      cost_price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    )
  `);
  
  // Pharmacy - Dispensing table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dispensing (
      id INTEGER PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      quantity INTEGER,
      dispensing_date TEXT,
      nurse_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (nurse_id) REFERENCES nurses(id)
    )
  `);
  
  return db;
}