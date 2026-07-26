import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { LogOut, Home, Download } from 'lucide-react';
import axios from 'axios';
import './Reports.css';

const Reports = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('patients');
  const [format, setFormat] = useState('pdf');

  const handleGenerateReport = async () => {
    try {
      let endpoint = '';
      if (reportType === 'patients') {
        endpoint = `/api/reports/patient/1?format=${format}`;
      } else if (reportType === 'appointments') {
        endpoint = `/api/reports/appointments/${format}`;
      } else if (reportType === 'laboratory') {
        endpoint = `/api/reports/laboratory/${format}`;
      }

      const response = await axios.get(`http://localhost:5000${endpoint}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      alert('Report downloaded successfully!');
    } catch (error) {
      alert('Error generating report');
    }
  };

  return (
    <div className="reports-page">
      <nav className="navbar">
        <div className="navbar-brand"><span className="logo-emoji">🏥</span><h1>Sunrise HRMS</h1></div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-item"><Home size={20} /> Dashboard</button>
          <button onClick={() => navigate('/patients')} className="nav-item">👥 Patients</button>
          <button onClick={() => navigate('/doctors')} className="nav-item">👨‍⚕️ Doctors</button>
          <button onClick={() => navigate('/appointments')} className="nav-item">📅 Appointments</button>
          <button onClick={() => navigate('/laboratory')} className="nav-item">🧬 Lab</button>
          <button onClick={() => navigate('/pharmacy')} className="nav-item">💊 Pharmacy</button>
          <button onClick={() => navigate('/reports')} className="nav-item active">📄 Reports</button>
        </div>
        <div className="navbar-user">
          <span>{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout"><LogOut size={20} /> Logout</button>
        </div>
      </nav>

      <div className="reports-content">
        <div className="page-header">
          <h2>Reports & Analytics</h2>
        </div>

        <div className="reports-container">
          <div className="report-card">
            <h3>Generate Report</h3>
            <div className="form-group">
              <label>Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="patients">Patient Reports</option>
                <option value="appointments">Appointment Reports</option>
                <option value="laboratory">Laboratory Reports</option>
              </select>
            </div>
            <div className="form-group">
              <label>Format</label>
              <div className="format-buttons">
                <button onClick={() => setFormat('pdf')} className={`format-btn ${format === 'pdf' ? 'active' : ''}`}>📄 PDF</button>
                <button onClick={() => setFormat('excel')} className={`format-btn ${format === 'excel' ? 'active' : ''}`}>📊 Excel</button>
                <button onClick={() => setFormat('csv')} className={`format-btn ${format === 'csv' ? 'active' : ''}`}>📋 CSV</button>
              </div>
            </div>
            <button onClick={handleGenerateReport} className="btn btn-primary">
              <Download size={20} /> Generate & Download
            </button>
          </div>

          <div className="report-info">
            <h3>Available Reports</h3>
            <div className="report-list">
              <div className="report-item">
                <span className="report-icon">👥</span>
                <div>
                  <strong>Patient Reports</strong>
                  <p>Complete patient demographics, medical history, and contact information</p>
                </div>
              </div>
              <div className="report-item">
                <span className="report-icon">📅</span>
                <div>
                  <strong>Appointment Reports</strong>
                  <p>All scheduled appointments with patient and doctor information</p>
                </div>
              </div>
              <div className="report-item">
                <span className="report-icon">🧬</span>
                <div>
                  <strong>Laboratory Reports</strong>
                  <p>Complete laboratory test results and analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;