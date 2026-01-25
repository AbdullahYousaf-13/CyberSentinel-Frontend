import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Page.css';
import './Precautions.css';

const PrecautionsPage = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <div className="precautions-grid">
          <section className="precaution-card">
            <h2 className="precaution-title">Network Hardening</h2>
            <ul className="precaution-list">
              <li>Enable firewall with least-privilege inbound rules</li>
              <li>Block unused ports; enforce geo-IP blocking where applicable</li>
              <li>Enforce TLS 1.2+ with HSTS</li>
            </ul>
          </section>

          <section className="precaution-card">
            <h2 className="precaution-title">Identity & Access</h2>
            <ul className="precaution-list">
              <li>Mandatory MFA for admins and remote access users</li>
              <li>Rotate credentials every 90 days; strong password policy</li>
              <li>Role-based access control; audit privileged actions</li>
            </ul>
          </section>

          <section className="precaution-card">
            <h2 className="precaution-title">Endpoint Protection</h2>
            <ul className="precaution-list">
              <li>EDR deployed with real-time scanning</li>
              <li>Disk encryption enabled; USB device restrictions</li>
              <li>Auto-lock and screen timeout policies</li>
            </ul>
          </section>

          <section className="precaution-card">
            <h2 className="precaution-title">Patching & Backups</h2>
            <ul className="precaution-list">
              <li>Critical security patches within 48 hours</li>
              <li>Weekly full backups; daily incremental backups</li>
              <li>Quarterly recovery drills with RPO/RTO targets</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrecautionsPage;


