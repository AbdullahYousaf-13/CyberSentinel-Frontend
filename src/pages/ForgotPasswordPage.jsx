import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';
import '../components/auth/Auth.css';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

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

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email');
      return;
    }
    // In real app, send OTP to email
    setStep(2);
    alert('OTP has been sent to your email');
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      alert('Please enter complete OTP');
      return;
    }
    // In real app, verify OTP
    setStep(3);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    // In real app, reset password
    alert('Password reset successful! Please login.');
    navigate('/login');
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp(['', '', '', '', '', '']);
    } else if (step === 3) {
      setStep(2);
      setPassword('');
      setConfirmPassword('');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="registration-container">
          <div className="registration-header">
            <h2>Reset Password</h2>
            <p>Step {step} of 3</p>
          </div>

          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>

          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
                <p style={{ color: '#8b9dc3', fontSize: '12px', marginTop: '8px' }}>
                  We'll send you an OTP to reset your password
                </p>
              </div>
              <div className="form-actions-register">
                <button type="button" className="btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Send OTP
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit}>
              <div className="form-group">
                <label style={{ textAlign: 'center', display: 'block', marginBottom: '20px' }}>
                  Enter the 6-digit OTP sent to {email}
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
              <div className="form-actions-register">
                <button type="button" className="btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Verify OTP
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="form-actions-register">
                <button type="button" className="btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Reset Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

