import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { disableTotp, fetchMe, setupTotp, verifyTotp } from '../services/api';
import './Page.css';
import './Settings.css';

const SettingsPage = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetupMode, setTwoFASetupMode] = useState(false);
  const [twoFADisableMode, setTwoFADisableMode] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [provisioningUri, setProvisioningUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFAInfo, setTwoFAInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const [copyMessage, setCopyMessage] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saveToast, setSaveToast] = useState('');
  const [frequency, setFrequency] = useState('immediate'); // 'immediate' | 'daily'
  const [severityFilters, setSeverityFilters] = useState({
    high: true,
    medium: true,
    low: true
  });

  useEffect(() => {
    fetchMe()
      .then((me) => setTwoFAEnabled(Boolean(me.is_2fa_enabled)))
      .catch(() => {
        // ignore
      });
  }, []);

  const resetTotpInputs = () => setOtp(['', '', '', '', '', '']);

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

  const handleTwoFAToggle = async () => {
    setTwoFAError('');
    setTwoFAInfo('');
    if (twoFAEnabled) {
      setTwoFADisableMode(true);
      setTwoFASetupMode(false);
      resetTotpInputs();
      return;
    }
    setIsSubmitting(true);
    try {
      const setup = await setupTotp();
      setProvisioningUri(setup.provisioning_uri);
      setTotpSecret(setup.totp_secret);
      setTwoFASetupMode(true);
      setTwoFADisableMode(false);
      setTwoFAInfo('Scan the link and enter the 6-digit code to enable 2FA.');
    } catch (err) {
      setTwoFAError('Failed to start 2FA setup.');
      setTwoFASetupMode(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEnable2FA = async () => {
    setTwoFAError('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setTwoFAError('Please enter the 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyTotp(otpCode);
      setTwoFAEnabled(true);
      setTwoFASetupMode(false);
      setTwoFAInfo('2FA enabled successfully.');
      resetTotpInputs();
    } catch (err) {
      setTwoFAError('Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable2FA = async () => {
    setTwoFAError('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setTwoFAError('Please enter the 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    try {
      await disableTotp(otpCode);
      setTwoFAEnabled(false);
      setTwoFADisableMode(false);
      setTwoFAInfo('2FA disabled successfully.');
      resetTotpInputs();
    } catch (err) {
      setTwoFAError('Invalid code. Please try again.');
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

  const toggleSeverity = (key) => {
    setSeverityFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Persist settings to API/storage (mock)
    setSaveToast('Settings saved successfully.');
    setTimeout(() => setSaveToast(''), 2000);
  };

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <div className="settings-grid">
          <section className="setting-card">
            <div className="setting-card-content">
              <h2>2FA Authentication</h2>
              <p className="muted">Add an extra layer of security to your account.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={twoFAEnabled} onChange={handleTwoFAToggle} />
              <span className="slider" />
            </label>
          </section>
          {(twoFASetupMode || twoFADisableMode || twoFAInfo || twoFAError) && (
            <section className="setting-card twofa-panel">
              <div className="setting-card-content">
                <h2>{twoFADisableMode ? 'Disable 2FA' : 'Enable 2FA'}</h2>
                <p className="muted">
                  {twoFADisableMode
                    ? 'Enter the 6-digit code from your authenticator app to disable 2FA.'
                    : 'Scan the link and confirm with a 6-digit code.'}
                </p>
              </div>
              <div className="twofa-setup-panel">
                {!twoFADisableMode && provisioningUri && (
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
                {!twoFADisableMode && totpSecret && (
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
                {!twoFADisableMode && (
                  <p className="form-note">
                    If the link does not open, add a new account in your authenticator app and paste
                    the secret manually.
                  </p>
                )}
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
                {twoFAInfo && <div className="form-info">{twoFAInfo}</div>}
                {twoFAError && <div className="form-error">{twoFAError}</div>}
                {copyMessage && <div className="form-info">{copyMessage}</div>}
                <div className="settings-actions">
                  {twoFADisableMode ? (
                    <button className="details-btn" onClick={handleDisable2FA} disabled={isSubmitting}>
                      Disable 2FA
                    </button>
                  ) : (
                    <button className="details-btn" onClick={handleVerifyEnable2FA} disabled={isSubmitting}>
                      Verify & Enable
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Email Notifications</h2>
              <p className="muted">Receive updates and alerts via email.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
              <span className="slider" />
            </label>
          </section>

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Alert Frequency</h2>
              <div className="btn-group">
                <button className={`btn ${frequency === 'immediate' ? 'active' : ''}`} onClick={() => setFrequency('immediate')}>Immediate</button>
                <button className={`btn ${frequency === 'daily' ? 'active' : ''}`} onClick={() => setFrequency('daily')}>Daily Digest</button>
              </div>
            </div>
          </section>

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Severity Filter</h2>
              <div className="btn-group">
                <button className={`severity-filter-btn high ${severityFilters.high ? 'active' : ''}`} onClick={() => toggleSeverity('high')}>High Severity</button>
                <button className={`severity-filter-btn medium ${severityFilters.medium ? 'active' : ''}`} onClick={() => toggleSeverity('medium')}>Medium Severity</button>
                <button className={`severity-filter-btn low ${severityFilters.low ? 'active' : ''}`} onClick={() => toggleSeverity('low')}>Low Severity</button>
              </div>
            </div>
          </section>
          {saveToast && (
            <div className="toast toast-success" role="status" aria-live="polite">
              {saveToast}
            </div>
          )}

          <div className="settings-actions">
            <button className="details-btn" onClick={handleSave}>Save Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;


