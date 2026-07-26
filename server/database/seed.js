import { getDatabase } from './init.js';

const kenyanNames = {
  male: ['John', 'James', 'David', 'Peter', 'Samuel', 'Michael', 'Daniel', 'Joseph', 'Paul', 'Thomas', 'Christopher', 'Richard', 'Charles', 'Andrew', 'Edward', 'George', 'Robert', 'William', 'Henry', 'Kenneth', 'Patrick', 'Stanley', 'Victor', 'Martin', 'Stephen'],
  female: ['Mary', 'Alice', 'Grace', 'Faith', 'Diana', 'Jane', 'Margaret', 'Helen', 'Susan', 'Anne', 'Catherine', 'Elizabeth', 'Dorothy', 'Patricia', 'Jennifer', 'Karen', 'Nancy', 'Janet', 'Maria', 'Sarah', 'Rachel', 'Ruth', 'Beverly', 'Sandra', 'Jessica']
};

const kenyanSurnames = ['Mwangi', 'Wanjiru', 'Otieno', 'Akinyi', 'Kariuki', 'Njeri', 'Kiptoo', 'Chebet', 'Kipchoge', 'Kiplagat', 'Musyoka', 'Mutua', 'Wanjiru', 'Kipchoge', 'Ochieng', 'Kipkemboi', 'Kiplagat', 'Kipchoge', 'Kipkemboi', 'Kiplagat', 'Kipkemboi', 'Kiplagat', 'Kipkemboi', 'Kiplagat', 'Kipkemboi', 'Kiplagat'];

const departments = ['General Medicine', 'Cardiology', 'Paediatrics', 'Orthopaedics', 'Surgery', 'Obstetrics', 'Neurology', 'Radiology', 'Emergency', 'ICU'];

const testNames = ['Blood Test', 'CBC', 'Urinalysis', 'Malaria', 'Typhoid', 'Blood Sugar', 'Liver Function', 'Kidney Function', 'COVID Test', 'HIV Test', 'Chest X-Ray', 'ECG'];

const medicines = [
  { name: 'Paracetamol', strength: '500mg', unit: 'tablet' },
  { name: 'Amoxicillin', strength: '250mg', unit: 'capsule' },
  { name: 'Azithromycin', strength: '500mg', unit: 'tablet' },
  { name: 'Metformin', strength: '500mg', unit: 'tablet' },
  { name: 'Insulin', strength: '100IU/ml', unit: 'vial' },
  { name: 'Ibuprofen', strength: '400mg', unit: 'tablet' },
  { name: 'ORS', strength: '4.75g/L', unit: 'sachet' },
  { name: 'Vitamin C', strength: '500mg', unit: 'tablet' },
  { name: 'Aspirin', strength: '100mg', unit: 'tablet' },
  { name: 'Atenolol', strength: '25mg', unit: 'tablet' }
];

function getRandomKenyanName(gender) {
  const firstNames = kenyanNames[gender];
  const surname = kenyanSurnames[Math.floor(Math.random() * kenyanSurnames.length)];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  return `${firstName} ${surname}`;
}

function generatePhone() {
  const operators = ['254701', '254702', '254703', '254704', '254705', '254706', '254707', '254708', '254709', '254710'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const number = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
  return `${operator}${number}`;
}

function generateNationalID() {
  return String(Math.floor(Math.random() * 999999999)).padStart(9, '0');
}

function generateMRN() {
  return 'MRN' + String(Math.floor(Math.random() * 999999)).padStart(6, '0');
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysAgo = 365) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0];
}

export async function seedDatabase() {
  const db = await getDatabase();
  
  // Check if already seeded
  const patientCount = await db.get('SELECT COUNT(*) as count FROM patients');
  if (patientCount && patientCount.count > 0) {
    console.log('Database already seeded');
    return;
  }
  
  // Seed Patients
  console.log('Seeding 100 patients...');
  for (let i = 0; i < 100; i++) {
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const name = getRandomKenyanName(gender === 'Male' ? 'male' : 'female');
    const age = Math.floor(Math.random() * 70) + 18;
    const phone = generatePhone();
    const nationalId = generateNationalID();
    const mrn = generateMRN();
    const counties = ['Kiambu', 'Nairobi', 'Kajiado', 'Muranga', 'Nakuru', 'Nyeri', 'Laikipia', 'Machakos', 'Makueni', 'Nairobi County'];
    const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    const insuranceProviders = ['Jubilee', 'AAR', 'APA', 'Heritage', 'NBEN', 'Occidental', 'Pacis', 'Zenith'];
    const allergies = ['Penicillin', 'Aspirin', 'Sulfa', 'None', 'Peanuts', 'Shellfish', 'Sulfonamides'];
    
    await db.run(
      `INSERT INTO patients (name, age, gender, phone, email, county, national_id, mrn, blood_group, allergy, insurance_provider, next_of_kin, emergency_contact, date_of_birth, address, occupation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        age,
        gender,
        phone,
        `${name.toLowerCase().replace(/ /g, '.')}@email.com`,
        getRandomElement(counties),
        nationalId,
        mrn,
        getRandomElement(bloodGroups),
        getRandomElement(allergies),
        getRandomElement(insuranceProviders),
        getRandomKenyanName(gender === 'Male' ? 'female' : 'male'),
        generatePhone(),
        getRandomDate(10950),
        `${Math.floor(Math.random() * 99999)} Hospital Lane, Nairobi`,
        getRandomElement(['Software Engineer', 'Teacher', 'Nurse', 'Accountant', 'Driver', 'Farmer', 'Merchant', 'Manager', 'Clerk', 'Retired'])
      ]
    );
  }
  
  // Seed Doctors
  console.log('Seeding 20 doctors...');
  const doctorNames = [
    { name: 'Dr. James Mwangi', dept: 'General Medicine' },
    { name: 'Dr. Alice Wanjiku', dept: 'Cardiology' },
    { name: 'Dr. David Ochieng', dept: 'Paediatrics' },
    { name: 'Dr. Grace Njeri', dept: 'Obstetrics' },
    { name: 'Dr. Samuel Kipchoge', dept: 'Surgery' },
    { name: 'Dr. Diana Chebet', dept: 'Radiology' },
    { name: 'Dr. Peter Kariuki', dept: 'Orthopaedics' },
    { name: 'Dr. Mary Wanjiru', dept: 'Neurology' },
    { name: 'Dr. Kevin Otieno', dept: 'Emergency' },
    { name: 'Dr. Faith Akinyi', dept: 'ICU' },
    { name: 'Dr. Joseph Kiplagat', dept: 'General Medicine' },
    { name: 'Dr. Susan Mutua', dept: 'Cardiology' },
    { name: 'Dr. Richard Musyoka', dept: 'Paediatrics' },
    { name: 'Dr. Catherine Kipkemboi', dept: 'Obstetrics' },
    { name: 'Dr. Michael Kipkemboi', dept: 'Surgery' },
    { name: 'Dr. Patricia Kiplagat', dept: 'Radiology' },
    { name: 'Dr. Andrew Kipchoge', dept: 'Orthopaedics' },
    { name: 'Dr. Elizabeth Kiplagat', dept: 'Neurology' },
    { name: 'Dr. Thomas Kipkemboi', dept: 'Emergency' },
    { name: 'Dr. Dorothy Kiplagat', dept: 'ICU' }
  ];
  
  for (const doctor of doctorNames) {
    await db.run(
      `INSERT INTO doctors (name, email, phone, department, qualification, license_number, availability, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor.name,
        `${doctor.name.toLowerCase().replace(/[\s.]/g, '')}@hospital.com`,
        generatePhone(),
        doctor.dept,
        getRandomElement(['MBBS', 'MD', 'DO', 'FRCS']),
        String(Math.floor(Math.random() * 999999)).padStart(6, '0'),
        getRandomElement(['Monday-Friday', 'Monday-Saturday', '24/7', 'On-call']),
        'https://via.placeholder.com/200'
      ]
    );
  }
  
  // Seed Nurses
  console.log('Seeding 30 nurses...');
  for (let i = 0; i < 30; i++) {
    const gender = Math.random() > 0.3 ? 'female' : 'male';
    const name = getRandomKenyanName(gender);
    
    await db.run(
      `INSERT INTO nurses (name, email, phone, department, shift, availability, license_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        `${name.toLowerCase().replace(/ /g, '.')}@hospital.com`,
        generatePhone(),
        getRandomElement(departments),
        getRandomElement(['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)']),
        getRandomElement(['Available', 'On-duty', 'Off-duty']),
        String(Math.floor(Math.random() * 999999)).padStart(6, '0')
      ]
    );
  }
  
  // Seed Appointments
  console.log('Seeding 300 appointments...');
  const patients = await db.all('SELECT id FROM patients LIMIT 100');
  const doctors = await db.all('SELECT id FROM doctors');
  
  for (let i = 0; i < 300; i++) {
    const patient = getRandomElement(patients);
    const doctor = getRandomElement(doctors);
    const appointmentDate = getRandomDate(365);
    const status = getRandomElement(['pending', 'completed', 'cancelled']);
    
    await db.run(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.id,
        doctor.id,
        appointmentDate,
        `${Math.floor(Math.random() * 12) + 8}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        getRandomElement(['Routine checkup', 'Follow-up', 'Blood pressure check', 'Consultation', 'Physical examination']),
        status,
        'Standard appointment'
      ]
    );
  }
  
  // Seed Medical Records
  console.log('Seeding medical records...');
  for (let i = 0; i < 100; i++) {
    const patient = getRandomElement(patients);
    const doctor = getRandomElement(doctors);
    
    await db.run(
      `INSERT INTO medical_records (patient_id, doctor_id, consultation_date, chief_complaint, diagnosis, prescription, notes, weight, height, temperature, blood_pressure, pulse, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.id,
        doctor.id,
        getRandomDate(365),
        getRandomElement(['Fever', 'Cough', 'Headache', 'Back pain', 'Fatigue', 'Nausea']),
        getRandomElement(['Hypertension', 'Diabetes', 'Common cold', 'Flu', 'Pneumonia', 'Malaria', 'Typhoid']),
        'Paracetamol 500mg x2 daily, Amoxicillin 250mg x3 daily',
        'Patient advised to rest and hydrate',
        (Math.random() * 40 + 60).toFixed(1),
        (Math.random() * 30 + 150).toFixed(1),
        (Math.random() * 2 + 36.5).toFixed(1),
        `${Math.floor(Math.random() * 50) + 100}/${Math.floor(Math.random() * 30) + 70}`,
        Math.floor(Math.random() * 40) + 60,
        getRandomDate(30)
      ]
    );
  }
  
  // Seed Laboratory Results
  console.log('Seeding 200 laboratory results...');
  for (let i = 0; i < 200; i++) {
    const patient = getRandomElement(patients);
    
    await db.run(
      `INSERT INTO laboratory_results (patient_id, test_name, test_category, result, result_date, reference_range, lab_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.id,
        getRandomElement(testNames),
        'Haematology',
        getRandomElement(['Positive', 'Negative', 'Normal', 'Abnormal', '12.5 g/dL']),
        getRandomDate(365),
        'Normal range',
        'Sample collected and analyzed',
        getRandomElement(['pending', 'completed', 'reviewed'])
      ]
    );
  }
  
  // Seed Medicines
  console.log('Seeding medicines...');
  for (const med of medicines) {
    await db.run(
      `INSERT INTO medicines (name, description, price, strength, unit, manufacturer)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        med.name,
        `${med.name} - ${med.strength}`,
        (Math.random() * 5000 + 500).toFixed(2),
        med.strength,
        med.unit,
        getRandomElement(['Novartis', 'Pfizer', 'GSK', 'Roche', 'Johnson & Johnson'])
      ]
    );
  }
  
  // Seed Medicine Stock
  console.log('Seeding medicine stock...');
  const medicineCounts = await db.all('SELECT id FROM medicines');
  for (const med of medicineCounts) {
    for (let i = 0; i < 5; i++) {
      const purchaseDate = getRandomDate(90);
      const expiryDate = new Date(purchaseDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      
      await db.run(
        `INSERT INTO medicine_stock (medicine_id, batch_number, quantity, expiry_date, purchase_date, cost_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          med.id,
          `BATCH${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
          Math.floor(Math.random() * 900) + 100,
          expiryDate.toISOString().split('T')[0],
          purchaseDate,
          (Math.random() * 3000 + 300).toFixed(2)
        ]
      );
    }
  }
  
  console.log('✓ Database seeded successfully!');
}