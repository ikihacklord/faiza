import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { AlertCircle, LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.endsWith('@gmail.com')) {
        setError('Please use an email ending with @gmail.com');
        setLoading(false);
        return;
      }

      await login(email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="hospital-logo">
            <span className="logo-icon">🏥</span>
          </div>
          <h1>Sunrise Hospital</h1>
          <p>Records Management System</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@gmail.com"
              required
            />
            <small>Use any @gmail.com email</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter any password"
              required
            />
            <small>Any password works for demo</small>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Administrator</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: demo@gmail.com</p>
          <p>Password: demo123</p>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
            This is a demonstration system for academic purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;