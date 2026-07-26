import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { LogOut, Home, Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import './Pharmacy.css';

const Pharmacy = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [stock, setStock] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('medicines');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    strength: '',
    unit: 'tablet',
    manufacturer: ''
  });
  const [dispensingForm, setDispensingForm] = useState({
    patient_id: '',
    medicine_id: '',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    try {
      const [medsRes, stockRes, patsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/pharmacy/medicines'),
        axios.get('http://localhost:5000/api/pharmacy/stock'),
        axios.get('http://localhost:5000/api/patients', { params: { limit: 1000 } })
      ]);
      setMedicines(medsRes.data);
      setStock(stockRes.data);
      setPatients(patsRes.data.patients);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/pharmacy/medicines', formData);
      fetchData();
      setShowForm(false);
      setFormData({ name: '', description: '', price: '', strength: '', unit: 'tablet', manufacturer: '' });
      alert('Medicine added successfully!');
    } catch (error) {
      alert('Error adding medicine');
    }
  };

  const handleDispenseMedicine = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/pharmacy/dispense', dispensingForm);
      fetchData();
      setDispensingForm({ patient_id: '', medicine_id: '', quantity: '', notes: '' });
      alert('Medicine dispensed successfully!');
    } catch (error) {
      alert('Error dispensing medicine');
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm('Delete this medicine?')) {
      try {
        await axios.delete(`http://localhost:5000/api/pharmacy/stock/${id}`);
        fetchData();
        alert('Medicine deleted!');
      } catch (error) {
        alert('Error deleting medicine');
      }
    }
  };

  return (
    <div className="pharmacy-page">
      <nav className="navbar">
        <div className="navbar-brand"><span className="logo-emoji">🏥</span><h1>Sunrise HRMS</h1></div>
        <div className="navbar-menu">
          <button onClick={() => navigate('/dashboard')} className="nav-item"><Home size={20} /> Dashboard</button>
          <button onClick={() => navigate('/patients')} className="nav-item">👥 Patients</button>
          <button onClick={() => navigate('/doctors')} className="nav-item">👨‍⚕️ Doctors</button>
          <button onClick={() => navigate('/appointments')} className="nav-item">📅 Appointments</button>
          <button onClick={() => navigate('/laboratory')} className="nav-item">🧬 Lab</button>
          <button onClick={() => navigate('/pharmacy')} className="nav-item active">💊 Pharmacy</button>
          <button onClick={() => navigate('/reports')} className="nav-item">📄 Reports</button>
        </div>
        <div className="navbar-user">
          <span>{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-logout"><LogOut size={20} /> Logout</button>
        </div>
      </nav>

      <div className="pharmacy-content">
        <div className="page-header">
          <h2>Pharmacy Management</h2>
          <button onClick={() => { setShowForm(!showForm); setTab('medicines'); }} className="btn btn-primary"><Plus size={20} /> Add Medicine</button>
        </div>

        <div className="pharmacy-tabs">
          <button onClick={() => { setTab('medicines'); setShowForm(false); }} className={`tab ${tab === 'medicines' ? 'active' : ''}`}>Medicines</button>
          <button onClick={() => { setTab('stock'); setShowForm(false); }} className={`tab ${tab === 'stock' ? 'active' : ''}`}>Stock</button>
          <button onClick={() => { setTab('dispense'); setShowForm(false); }} className={`tab ${tab === 'dispense' ? 'active' : ''}`}>Dispense</button>
        </div>

        {tab === 'medicines' && showForm && (
          <div className="form-card">
            <h3>Add New Medicine</h3>
            <form onSubmit={handleAddMedicine}>
              <div className="form-grid">
                <div className="form-group"><label>Medicine Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label>Strength</label><input type="text" value={formData.strength} onChange={(e) => setFormData({...formData, strength: e.target.value})} /></div>
                <div className="form-group"><label>Unit</label><select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                  <option>tablet</option><option>capsule</option><option>vial</option><option>sachet</option><option>bottle</option>
                </select></div>
                <div className="form-group"><label>Price</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} /></div>
                <div className="form-group"><label>Manufacturer</label><input type="text" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} /></div>
                <div className="form-group"><label>Description</label><input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Add Medicine</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {tab === 'dispense' && (
          <div className="form-card">
            <h3>Dispense Medicine</h3>
            <form onSubmit={handleDispenseMedicine}>
              <div className="form-grid">
                <div className="form-group"><label>Patient *</label><select value={dispensingForm.patient_id} onChange={(e) => setDispensingForm({...dispensingForm, patient_id: e.target.value})} required>
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
                <div className="form-group"><label>Medicine *</label><select value={dispensingForm.medicine_id} onChange={(e) => setDispensingForm({...dispensingForm, medicine_id: e.target.value})} required>
                  <option value="">Select Medicine</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name} {m.strength}</option>)}
                </select></div>
                <div className="form-group"><label>Quantity *</label><input type="number" value={dispensingForm.quantity} onChange={(e) => setDispensingForm({...dispensingForm, quantity: e.target.value})} required /></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={dispensingForm.notes} onChange={(e) => setDispensingForm({...dispensingForm, notes: e.target.value})} rows="3"></textarea></div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Dispense</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading pharmacy data...</div>
        ) : (
          <>
            {tab === 'medicines' && (
              <div className="medicines-container">
                {medicines.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Strength</th>
                        <th>Unit</th>
                        <th>Price</th>
                        <th>Manufacturer</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map(med => (
                        <tr key={med.id}>
                          <td><strong>{med.name}</strong></td>
                          <td>{med.strength}</td>
                          <td>{med.unit}</td>
                          <td>KES {med.price}</td>
                          <td>{med.manufacturer}</td>
                          <td>{med.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state"><p>No medicines found. Add one to get started!</p></div>
                )}
              </div>
            )}

            {tab === 'stock' && (
              <div className="stock-container">
                {stock.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Batch Number</th>
                        <th>Quantity</th>
                        <th>Expiry Date</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong></td>
                          <td><code>{item.batch_number}</code></td>
                          <td>{item.quantity}</td>
                          <td>{item.expiry_date}</td>
                          <td>KES {item.price}</td>
                          <td><button onClick={() => handleDeleteMedicine(item.id)} className="btn-icon">🗑️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state"><p>No stock found.</p></div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Pharmacy;