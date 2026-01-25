import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, setupTotp, verifyTotp } from '../../services/api';
import './Auth.css';

const RegisterForm = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: TOTP
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [enable2fa, setEnable2fa] = useState(false);
  const [provisioningUri, setProvisioningUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = e.target.parentElement.nextElementSibling?.querySelector('input');
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = e.target.parentElement.previousElementSibling?.querySelector('input');
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
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
        await register(formData.email, formData.password);
        const loginResponse = await login(formData.email, formData.password);
        localStorage.setItem('token', loginResponse.access_token);
        localStorage.setItem('userEmail', formData.email);
        if (enable2fa) {
          const setup = await setupTotp();
          setProvisioningUri(setup.provisioning_uri);
          setTotpSecret(setup.totp_secret);
          setStep(2);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        setError('Registration failed. Check if an admin already exists.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
        setError('Please enter the 6-digit code from your authenticator app.');
        return;
      }
      setIsSubmitting(true);
      try {
        await verifyTotp(otpCode);
        navigate('/dashboard');
      } catch (err) {
        setError('Invalid TOTP code. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h2>Create New Account</h2>
        <p>Step {step} of 2</p>
      </div>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 ? (
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
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
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
                <span className="toggle-text">Enable 2FA now (recommended)</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-group totp-setup">
              <label style={{ textAlign: 'center', display: 'block', marginBottom: '12px' }}>
                Scan this in your authenticator app
              </label>
              {provisioningUri && (
                <a className="totp-link" href={provisioningUri}>
                  Open authenticator link
                </a>
              )}
              <div className="totp-secret">
                Secret: <span>{totpSecret}</span>
              </div>
              <label style={{ textAlign: 'center', display: 'block', margin: '20px 0 10px' }}>
                Enter the 6-digit code from your app
              </label>
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="otp-digit"
                    required
                  />
                ))}
              </div>
            </div>
          </>
        )}
        {error && <div className="form-error">{error}</div>}

        <div className="form-actions-register">
          <button type="button" className="btn-back" onClick={handleBack}>
            Back
          </button>
          <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
            {step === 1 ? 'Continue' : 'Verify & Register'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
