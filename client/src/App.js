import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Laboratory from './pages/Laboratory';
import Pharmacy from './pages/Pharmacy';
import Reports from './pages/Reports';
import Website from './pages/Website';

import './App.css';

export const AuthContext = createContext();
export const APIContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        role: role || 'admin'
      });
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Sunrise HRMS...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <Routes>
          <Route path="/" element={<Website />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/patients" element={user ? <Patients /> : <Navigate to="/login" />} />
          <Route path="/patients/:id" element={user ? <PatientDetail /> : <Navigate to="/login" />} />
          <Route path="/doctors" element={user ? <Doctors /> : <Navigate to="/login" />} />
          <Route path="/appointments" element={user ? <Appointments /> : <Navigate to="/login" />} />
          <Route path="/laboratory" element={user ? <Laboratory /> : <Navigate to="/login" />} />
          <Route path="/pharmacy" element={user ? <Pharmacy /> : <Navigate to="/login" />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;