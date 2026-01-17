import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAccessSystem = (e) => {
    e.preventDefault();
    // Handle login logic here - for now just navigate to dashboard
    navigate('/dashboard');
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

        <div className="form-actions">
          <button type="submit" className="btn-primary">
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
