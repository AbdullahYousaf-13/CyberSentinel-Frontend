import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const RegisterForm = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      // Validate form
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }
      // In real app, send data to backend and receive OTP
      // For now, just move to OTP step
      setStep(2);
      // Simulate OTP being sent
      alert('OTP has been sent to your email');
    } else {
      // Verify OTP
      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
        alert('Please enter complete OTP');
        return;
      }
      // In real app, verify OTP with backend
      // For now, just navigate to login
      alert('Registration successful! Please login.');
      navigate('/login');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp(['', '', '', '', '', '']);
    } else {
      navigate('/login');
    }
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
          </>
        ) : (
          <>
            <div className="form-group">
              <label style={{ textAlign: 'center', display: 'block', marginBottom: '20px' }}>
                Enter the 6-digit OTP sent to {formData.email}
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

        <div className="form-actions-register">
          <button type="button" className="btn-back" onClick={handleBack}>
            Back
          </button>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            {step === 1 ? 'Continue' : 'Verify & Register'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
