import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Page.css';
import './Settings.css';

const SettingsPage = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [frequency, setFrequency] = useState('immediate'); // 'immediate' | 'daily'
  const [severityFilters, setSeverityFilters] = useState({
    high: true,
    medium: true,
    low: true
  });

  const toggleSeverity = (key) => {
    setSeverityFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Persist settings to API/storage (mock)
    alert('Settings saved');
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
              <input type="checkbox" checked={twoFAEnabled} onChange={() => setTwoFAEnabled(!twoFAEnabled)} />
              <span className="slider" />
            </label>
          </section>

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

          <div className="settings-actions">
            <button className="save-btn" onClick={handleSave}>Save Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;


