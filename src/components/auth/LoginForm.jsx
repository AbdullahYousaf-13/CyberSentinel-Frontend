import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchMe, login } from '../../services/api';
import './Auth.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    totpCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location.state?.message;

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
      try {
        const me = await fetchMe();
        const fullName = [me.first_name, me.last_name].filter(Boolean).join(' ');
        if (fullName) {
          localStorage.setItem('userName', fullName);
        }
      } catch (err) {
        // Ignore profile fetch failures and fall back to email.
      }
      if (localStorage.getItem('pending2fa') === 'true') {
        navigate('/setup-2fa');
      } else {
        navigate('/dashboard');
      }
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
      <img
        src={`${process.env.PUBLIC_URL}/cybersentinel-logo.png`}
        alt=""
        aria-hidden="true"
        className="login-watermark"
      />
      <div className="login-header">
        <h1>CyberSentinel</h1>
        <p className="login-caption">AI-Driven Security for Intrusion Detection</p>
      </div>
      
      <form className="login-form" onSubmit={handleAccessSystem}>
        <div className="form-group">
          <label htmlFor="email">Username*</label>
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
          <label htmlFor="password">Password*</label>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M3.3 3.3a1 1 0 0 1 1.4 0l16 16a1 1 0 0 1-1.4 1.4l-2.2-2.2A10.7 10.7 0 0 1 12 20C7 20 2.7 16.7 1 12c.6-1.6 1.6-3 2.9-4.2L3.3 4.7a1 1 0 0 1 0-1.4ZM12 6c5 0 9.3 3.3 11 8-.7 1.8-1.8 3.4-3.3 4.7l-1.5-1.5A9 9 0 0 0 20.9 14C19.5 10.6 16 8 12 8c-.8 0-1.6.1-2.3.3L8 6.6C9.3 6.2 10.6 6 12 6Zm0 4a4 4 0 0 1 4 4c0 .6-.1 1.1-.3 1.6l-5.3-5.3c.5-.2 1-.3 1.6-.3Zm-4 4c0-.5.1-1.1.3-1.6l5.3 5.3c-.5.2-1 .3-1.6.3a4 4 0 0 1-4-4Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 5c5 0 9.3 3.1 11 7-1.7 3.9-6 7-11 7S2.7 15.9 1 12c1.7-3.9 6-7 11-7Zm0 2C8.3 7 5.1 9.2 3.6 12 5.1 14.8 8.3 17 12 17s6.9-2.2 8.4-5c-1.5-2.8-4.7-5-8.4-5Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Zm0 2A.5.5 0 1 0 12.5 12 .5.5 0 0 0 12 11.5Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>
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
        {infoMessage && <div className="form-info">{infoMessage}</div>}
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
        <p className="login-footer">Secured by CyberSentinel AI - v2.01</p>
      </form>
    </div>
  );
};

export default LoginForm;
