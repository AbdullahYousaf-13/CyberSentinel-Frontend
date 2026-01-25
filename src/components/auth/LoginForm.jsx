import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import './Auth.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    totpCode: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAccessSystem = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await login(
        formData.email,
        formData.password,
        formData.totpCode || null
      );
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('userEmail', formData.email);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Check your email/password or TOTP setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>CYBERSENTINEL</h1>
        <p className="login-subtitle">Secure Your Digital Frontier</p>
      </div>
      
      <form className="login-form" onSubmit={handleAccessSystem}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="totpCode">TOTP Code (if enabled)</label>
          <input
            type="text"
            id="totpCode"
            name="totpCode"
            value={formData.totpCode}
            onChange={handleChange}
            placeholder="123456"
          />
        </div>
        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            Access System
          </button>
          <button type="button" className="btn-secondary" onClick={handleCreateAccount}>
            Create New Account
          </button>
        </div>

        <div className="forgot-password">
          <button type="button" className="forgot-password-btn" onClick={handleForgotPassword}>
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
