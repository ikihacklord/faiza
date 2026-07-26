import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { LogOut, Home, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import './Laboratory.css';

const Laboratory = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    test_name: 'Blood Test',
    test_category: 'Haematology',
    result: '',
    reference_range: 'Normal range',
    lab_notes: ''
  });

  const testTypes = ['Blood Test', 'CBC', 'Urinalysis', 'Malaria', 'Typhoid', 'Blood Sugar', 'Liver Function', 'Kidney Function', 'COVID Test', 'HIV Test'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [labRes, patsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/laboratory'),
        axios.get('http://localhost:5000/api/patients', { params: { limit: 1000 } })
      ]);
      setResults(labRes.data.results);
      setPatients(patsRes.data.patients);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/laboratory', formData);
      fetchData();
      setShowForm(false);
      setFormData({ patient_id: '', test_name: 'Blood Test', test_category: 'Haematology', result: '', reference_range: 'Normal range', lab_notes: '' });
      alert('Lab result added successfully!');
    } catch (error) {
      alert('Error adding lab result');
    }
  };

  const handleDeleteResult = async (id) => {
    if (window.confirm('Delete this result?')) {
      try {
        await axios.delete(`http://localhost:5000/api/laboratory/${id}`);
        fetchData();
        alert('Result deleted!');
      } catch (error) {
        alert('Error deleting result');
      }
    }
  };

  return (
    <div className="laboratory-page">
      <nav className="navbar">
        <div className="navbar-brand"><span className="logo-emoji">🏥</span><h1>Sunrise HRMS</h1></div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-item"><Home size={20} /> Dashboard</button>
          <button onClick={() => navigate('/patients')} className="nav-item">👥 Patients</button>
          <button onClick={() => navigate('/doctors')} className="nav-item">👨‍⚕️ Doctors</button>
          <button onClick={() => navigate('/appointments')} className="nav-item">📅 Appointments</button>
          <button onClick={() => navigate('/laboratory')} className="nav-item active">🧬 Lab</button>
          <button onClick={() => navigate('/pharmacy')} className="nav-item">💊 Pharmacy</button>
          <button onClick={() => navigate('/reports')} className="nav-item">📄 Reports</button>
        </div>
        <div className="navbar-user">
          <span>{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout"><LogOut size={20} /> Logout</button>
        </div>
      </nav>

      <div className="laboratory-content">
        <div className="page-header">
          <h2>Laboratory Management</h2>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary"><Plus size={20} /> New Test Result</button>
        </div>

        {showForm && (
          <div className="form-card">
            <h3>Add Laboratory Result</h3>
            <form onSubmit={handleAddResult}>
              <div className="form-grid">
                <div className="form-group"><label>Patient *</label><select value={formData.patient_id} onChange={(e) => setFormData({...formData, patient_id: e.target.value})} required>
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
                </select></div>
                <div className="form-group"><label>Test Name *</label><select value={formData.test_name} onChange={(e) => setFormData({...formData, test_name: e.target.value})} required>
                  {testTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
                <div className="form-group"><label>Category</label><input type="text" value={formData.test_category} onChange={(e) => setFormData({...formData, test_category: e.target.value})} /></div>
                <div className="form-group"><label>Result *</label><input type="text" value={formData.result} onChange={(e) => setFormData({...formData, result: e.target.value})} required /></div>
              </div>
              <div className="form-group"><label>Lab Notes</label><textarea value={formData.lab_notes} onChange={(e) => setFormData({...formData, lab_notes: e.target.value})} rows="3"></textarea></div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Save Result</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading lab results...</div>
        ) : (
          <div className="results-container">
            {results.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Test Name</th>
                    <th>Result</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(result => (
                    <tr key={result.id}>
                      <td><strong>{result.patient_name}</strong></td>
                      <td>{result.test_name}</td>
                      <td><code>{result.result}</code></td>
                      <td>{result.result_date}</td>
                      <td><span className={`status ${result.status}`}>{result.status}</span></td>
                      <td><small>{result.lab_notes}</small></td>
                      <td><button onClick={() => handleDeleteResult(result.id)} className="btn-icon delete">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><p>No lab results found.</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Laboratory;