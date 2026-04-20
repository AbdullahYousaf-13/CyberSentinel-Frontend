import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupTotp, verifyTotp } from '../services/api';
import AuthScaleFit from '../components/auth/AuthScaleFit';
import './AuthPage.css';
import '../components/auth/Auth.css';

const TwoFactorSetupPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [provisioningUri, setProvisioningUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    const initSetup = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/login', { state: { message: 'Please log in to enable 2FA.' } });
        return;
      }
      try {
        const setup = await setupTotp();
        setProvisioningUri(setup.provisioning_uri);
        setTotpSecret(setup.totp_secret);
      } catch (err) {
        setError('Failed to start 2FA setup. Please log in again.');
        setTimeout(() => {
          navigate('/login', { state: { message: 'Please log in to enable 2FA.' } });
        }, 800);
      }
    };
    initSetup();
  }, [navigate]);

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

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyTotp(otpCode);
      localStorage.removeItem('pending2fa');
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid TOTP code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${label} copied.`);
      setTimeout(() => setCopyMessage(''), 1500);
    } catch (err) {
      setCopyMessage('Copy failed. Please copy manually.');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <AuthScaleFit>
          <div className="registration-container">
            <div className="registration-header">
              <h2>Enable Two-Factor Authentication</h2>
            </div>

            <form onSubmit={handleVerify}>
              <div className="form-group totp-setup">
                {provisioningUri && (
                  <div className="totp-link-row">
                    <a className="totp-link" href={provisioningUri} target="_blank" rel="noreferrer">
                      Open Authenticator Link
                    </a>
                    <button
                      type="button"
                      className="details-btn"
                      onClick={() => handleCopy(provisioningUri, 'Link')}
                    >
                      Copy Link
                    </button>
                  </div>
                )}
                {totpSecret && (
                  <div className="totp-secret">
                    Secret: <span>{totpSecret}</span>
                    <button
                      type="button"
                      className="details-btn"
                      onClick={() => handleCopy(totpSecret, 'Secret')}
                      style={{ marginLeft: '12px' }}
                    >
                      Copy Secret
                    </button>
                  </div>
                )}
                <p className="form-note">
                  If the link does not open, add a new account in your authenticator app and paste the
                  secret manually.
                </p>
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
                      ref={(el) => (otpRefs.current[index] = el)}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="otp-digit"
                      required
                    />
                  ))}
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}
              {copyMessage && <div className="form-info">{copyMessage}</div>}

              <div className="form-actions-register">
                <button type="button" className="btn-back" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  Verify & Enable
                </button>
              </div>
            </form>
          </div>
        </AuthScaleFit>
      </div>
    </div>
  );
};

export default TwoFactorSetupPage;
