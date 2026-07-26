import express from 'express';
import { getDatabase } from '../database/init.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';

const router = express.Router();

// Generate patient report
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { format = 'json' } = req.query;
    
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [req.params.patient_id]);
    const records = await db.all('SELECT * FROM medical_records WHERE patient_id = ? ORDER BY consultation_date DESC', [req.params.patient_id]);
    const labResults = await db.all('SELECT * FROM laboratory_results WHERE patient_id = ? ORDER BY result_date DESC', [req.params.patient_id]);
    const appointments = await db.all('SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC', [req.params.patient_id]);
    
    const report = { patient, records, labResults, appointments };
    
    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="patient-${patient.id}.pdf"`);
      doc.pipe(res);
      
      doc.fontSize(20).text('Patient Report', { align: 'center' });
      doc.fontSize(12).text(`Name: ${patient.name}`);
      doc.text(`MRN: ${patient.mrn}`);
      doc.text(`Age: ${patient.age}`);
      doc.text(`Blood Group: ${patient.blood_group}`);
      doc.text(`Insurance: ${patient.insurance_provider}`);
      doc.moveDown();
      
      doc.fontSize(14).text('Medical History');
      records.forEach(record => {
        doc.fontSize(10).text(`Date: ${record.consultation_date}`);
        doc.text(`Diagnosis: ${record.diagnosis}`);
        doc.text(`Notes: ${record.notes}`);
        doc.moveDown();
      });
      
      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Patient Report');
      
      worksheet.addRow(['Patient Report']);
      worksheet.addRow(['Name', patient.name]);
      worksheet.addRow(['MRN', patient.mrn]);
      worksheet.addRow(['Age', patient.age]);
      worksheet.addRow(['Blood Group', patient.blood_group]);
      worksheet.addRow([]);
      
      worksheet.addRow(['Medical History']);
      worksheet.addRow(['Date', 'Diagnosis', 'Notes']);
      records.forEach(record => {
        worksheet.addRow([record.consultation_date, record.diagnosis, record.notes]);
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="patient-${patient.id}.xlsx"`);
      await workbook.xlsx.write(res);
    } else if (format === 'csv') {
      const rows = [
        ['Patient Report'],
        ['Name', patient.name],
        ['MRN', patient.mrn],
        ['Age', patient.age],
        ['Blood Group', patient.blood_group],
        [],
        ['Medical History'],
        ['Date', 'Diagnosis', 'Notes']
      ];
      
      records.forEach(record => {
        rows.push([record.consultation_date, record.diagnosis, record.notes]);
      });
      
      const csv = stringify(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="patient-${patient.id}.csv"`);
      res.send(csv);
    } else {
      res.json(report);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate appointment report
router.get('/appointments/:format?', async (req, res) => {
  try {
    const db = await getDatabase();
    const format = req.params.format || 'json';
    
    const appointments = await db.all(
      'SELECT a.*, p.name as patient_name, d.name as doctor_name FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN doctors d ON a.doctor_id = d.id ORDER BY a.appointment_date DESC'
    );
    
    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="appointments-report.pdf"');
      doc.pipe(res);
      
      doc.fontSize(20).text('Appointments Report', { align: 'center' });
      doc.moveDown();
      
      appointments.forEach(apt => {
        doc.fontSize(10).text(`Date: ${apt.appointment_date} ${apt.appointment_time}`);
        doc.text(`Patient: ${apt.patient_name}`);
        doc.text(`Doctor: ${apt.doctor_name}`);
        doc.text(`Status: ${apt.status}`);
        doc.moveDown();
      });
      
      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Appointments');
      
      worksheet.addRow(['Date', 'Time', 'Patient', 'Doctor', 'Status']);
      appointments.forEach(apt => {
        worksheet.addRow([apt.appointment_date, apt.appointment_time, apt.patient_name, apt.doctor_name, apt.status]);
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="appointments-report.xlsx"');
      await workbook.xlsx.write(res);
    } else if (format === 'csv') {
      const rows = [['Date', 'Time', 'Patient', 'Doctor', 'Status']];
      appointments.forEach(apt => {
        rows.push([apt.appointment_date, apt.appointment_time, apt.patient_name, apt.doctor_name, apt.status]);
      });
      
      const csv = stringify(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="appointments-report.csv"');
      res.send(csv);
    } else {
      res.json(appointments);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate laboratory report
router.get('/laboratory/:format?', async (req, res) => {
  try {
    const db = await getDatabase();
    const format = req.params.format || 'json';
    
    const labResults = await db.all(
      'SELECT l.*, p.name as patient_name FROM laboratory_results l JOIN patients p ON l.patient_id = p.id ORDER BY l.result_date DESC'
    );
    
    if (format === 'csv') {
      const rows = [['Date', 'Patient', 'Test', 'Result', 'Status']];
      labResults.forEach(result => {
        rows.push([result.result_date, result.patient_name, result.test_name, result.result, result.status]);
      });
      
      const csv = stringify(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="laboratory-report.csv"');
      res.send(csv);
    } else {
      res.json(labResults);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;