import React, { useEffect, useRef, useState } from 'react';
import {
  disableTotp,
  fetchMe,
  setupTotp,
  updateNotificationPreferences,
  verifyTotp
} from '../services/api';
import './Page.css';
import './Settings.css';

const DEFAULT_SEVERITIES = ['high', 'medium', 'low'];
const PAKISTAN_TIMEZONE = 'Asia/Karachi';

const mapSeveritiesToState = (severities = DEFAULT_SEVERITIES) => ({
  high: severities.includes('high'),
  medium: severities.includes('medium'),
  low: severities.includes('low')
});

const extractErrorMessage = (err, fallback) => {
  if (!err || typeof err.message !== 'string') return fallback;
  const message = err.message.trim();
  if (!message) return fallback;
  return message;
};

const SettingsPage = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetupMode, setTwoFASetupMode] = useState(false);
  const [twoFADisableMode, setTwoFADisableMode] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [totpSecret, setTotpSecret] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFAInfo, setTwoFAInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const [copyMessage, setCopyMessage] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [saveToast, setSaveToast] = useState('');
  const [prefsError, setPrefsError] = useState('');
  const [frequency, setFrequency] = useState('immediate');
  const [timezoneName, setTimezoneName] = useState(PAKISTAN_TIMEZONE);
  const [severityFilters, setSeverityFilters] = useState(mapSeveritiesToState(DEFAULT_SEVERITIES));

  useEffect(() => {
    fetchMe()
      .then((me) => {
        setTwoFAEnabled(Boolean(me.is_2fa_enabled));
        setEmailVerified(Boolean(me.email_verified));
        const prefs = me.notification_prefs || {};
        setEmailNotifications(Boolean(prefs.email_enabled));
        setFrequency(prefs.frequency === 'daily' ? 'daily' : 'immediate');
        const severities = Array.isArray(prefs.severities) && prefs.severities.length > 0
          ? prefs.severities
          : DEFAULT_SEVERITIES;
        setSeverityFilters(mapSeveritiesToState(severities));
        setTimezoneName(typeof prefs.timezone === 'string' && prefs.timezone.trim()
          ? prefs.timezone
          : PAKISTAN_TIMEZONE);
      })
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
      setTotpSecret(setup.totp_secret);
      setTwoFASetupMode(true);
      setTwoFADisableMode(false);
      setTwoFAInfo('');
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

  const handleEmailNotificationsToggle = () => {
    setPrefsError('');
    if (!emailNotifications && !emailVerified) {
      setPrefsError('Verify your email address before enabling email notifications.');
      return;
    }
    setEmailNotifications((prev) => !prev);
  };

  const toggleSeverity = (key) => {
    if (!emailNotifications) return;
    setSeverityFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setPrefsError('');
    const selectedSeverities = Object.entries(severityFilters)
      .filter(([, enabled]) => enabled)
      .map(([severity]) => severity);

    if (emailNotifications && selectedSeverities.length === 0) {
      setPrefsError('Select at least one severity when email notifications are enabled.');
      return;
    }
    if (emailNotifications && !emailVerified) {
      setPrefsError('Verify your email address before enabling email notifications.');
      return;
    }

    const payload = {
      email_enabled: emailNotifications,
      frequency,
      severities: selectedSeverities.length > 0 ? selectedSeverities : DEFAULT_SEVERITIES,
      timezone: PAKISTAN_TIMEZONE
    };

    try {
      const savedPrefs = await updateNotificationPreferences(payload);
      setTimezoneName(savedPrefs.timezone || payload.timezone);
      setEmailNotifications(Boolean(savedPrefs.email_enabled));
      setFrequency(savedPrefs.frequency === 'daily' ? 'daily' : 'immediate');
      setSeverityFilters(mapSeveritiesToState(savedPrefs.severities || DEFAULT_SEVERITIES));
      setSaveToast('Settings saved successfully.');
      setTimeout(() => setSaveToast(''), 2000);
    } catch (err) {
      setPrefsError(extractErrorMessage(err, 'Failed to save notification settings.'));
    }
  };

  return (
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
                    : 'Activate 2FA by adding this secret to your authenticator app and confirming with a 6-digit code.'}
                </p>
              </div>
              <div className="twofa-setup-panel">
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
                    Add this secret to your authenticator app, enter the 6-digit code below, then
                    click Verify & Enable.
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
              {!emailVerified && (
                <p className="muted settings-helper">Verify your email to enable alert notifications.</p>
              )}
              <p className="muted settings-helper">Timezone: {timezoneName}</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={handleEmailNotificationsToggle}
                aria-label="Email notifications toggle"
              />
              <span className="slider" />
            </label>
          </section>

          <section className={`setting-card ${!emailNotifications ? 'is-disabled' : ''}`}>
            <div className="setting-card-content">
              <h2>Alert Frequency</h2>
              <div className="btn-group">
                <button
                  className={`btn ${frequency === 'immediate' ? 'active' : ''}`}
                  onClick={() => setFrequency('immediate')}
                  disabled={!emailNotifications}
                >
                  Immediate
                </button>
                <button
                  className={`btn ${frequency === 'daily' ? 'active' : ''}`}
                  onClick={() => setFrequency('daily')}
                  disabled={!emailNotifications}
                >
                  Daily Digest
                </button>
              </div>
              {!emailNotifications && (
                <p className="muted settings-helper">Enable notifications to edit alert frequency.</p>
              )}
            </div>
          </section>

          <section className={`setting-card ${!emailNotifications ? 'is-disabled' : ''}`}>
            <div className="setting-card-content">
              <h2>Severity Filter</h2>
              <div className="btn-group">
                <button
                  className={`severity-filter-btn high ${severityFilters.high ? 'active' : ''}`}
                  onClick={() => toggleSeverity('high')}
                  disabled={!emailNotifications}
                >
                  High Severity
                </button>
                <button
                  className={`severity-filter-btn medium ${severityFilters.medium ? 'active' : ''}`}
                  onClick={() => toggleSeverity('medium')}
                  disabled={!emailNotifications}
                >
                  Medium Severity
                </button>
                <button
                  className={`severity-filter-btn low ${severityFilters.low ? 'active' : ''}`}
                  onClick={() => toggleSeverity('low')}
                  disabled={!emailNotifications}
                >
                  Low Severity
                </button>
              </div>
              {!emailNotifications && (
                <p className="muted settings-helper">Enable notifications to edit severity filters.</p>
              )}
            </div>
          </section>

          {prefsError && (
            <div className="toast" role="alert" aria-live="assertive">
              {prefsError}
            </div>
          )}
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
  );
};

export default SettingsPage;
