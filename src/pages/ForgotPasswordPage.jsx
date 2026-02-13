import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset, resetPassword, verifyPasswordResetCode } from '../services/api';
import './AuthPage.css';
import '../components/auth/Auth.css';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setIsSubmitting(true);
    requestPasswordReset(email)
      .then(() => {
        setStep(2);
        setInfo('A reset code has been sent to your email.');
      })
      .catch(() => {
        setError('Failed to send reset code. Please try again.');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    verifyPasswordResetCode(email, otpCode)
      .then(() => {
        setStep(3);
      })
      .catch(() => {
        setError('Invalid or expired reset code.');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const otpCode = otp.join('');
    setIsSubmitting(true);
    resetPassword(email, otpCode, password)
      .then(() => {
        navigate('/login', { state: { message: 'Password reset successful. You can now log in.' } });
      })
      .catch(() => {
        setError('Failed to reset password. Please try again.');
      })
      .finally(() => setIsSubmitting(false));
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
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
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
                      ref={(el) => (otpRefs.current[index] = el)}
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
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  Verify OTP
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
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
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <div className="password-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmNewPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
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
              <div className="form-actions-register">
                <button type="button" className="btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  Reset Password
                </button>
              </div>
            </form>
          )}
          {info && <div className="form-info">{info}</div>}
          {error && <div className="form-error">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

