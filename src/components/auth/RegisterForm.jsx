import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/api';
import './Auth.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [enable2fa, setEnable2fa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      if (enable2fa) {
        localStorage.setItem('pending2fa', 'true');
      } else {
        localStorage.removeItem('pending2fa');
      }
      setVerificationSent(true);
    } catch (err) {
      setError('Registration failed. Check if an admin already exists.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h2>Create New Account</h2>
        <p>Verify your email to continue</p>
      </div>

      <form onSubmit={handleSubmit}>
        {!verificationSent ? (
          <>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
              />
            </div>

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
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
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
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
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
            <div className="form-group toggle-group">
              <div className="toggle-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={enable2fa}
                    onChange={(e) => setEnable2fa(e.target.checked)}
                  />
                  <span className="toggle-pill" />
                </label>
                <span className="toggle-text">Enable 2FA Now (Recommended)</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <div className="form-info">
                We sent a verification email to {formData.email}. Please verify your email
                to continue. After verification, you can log in with your credentials.
              </div>
              {enable2fa && (
                <p className="form-note">
                  You chose to enable 2FA. After you log in, you'll be guided through 2FA setup.
                </p>
              )}
            </div>
          </>
        )}
        {error && <div className="form-error">{error}</div>}

        <div className="form-actions-register">
          <button type="button" className="btn-back" onClick={handleBack}>
            Back
          </button>
          {!verificationSent ? (
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={() => navigate('/login')}
            >
              Go To Login
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
