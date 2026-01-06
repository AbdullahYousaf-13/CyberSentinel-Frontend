import React, { useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertsTable from '../components/dashboard/AlertsTable';
import { mockAlerts } from '../data/mockData';
import './Page.css';
import './AlertsToolbar.css';

const AlertsPage = () => {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');

  const filtered = useMemo(() => {
    return mockAlerts.filter((a) => {
      const matchesQuery =
        a.id.toLowerCase().includes(query.toLowerCase()) ||
        a.sourceIP.includes(query) ||
        a.attackType.toLowerCase().includes(query.toLowerCase());
      const matchesSeverity =
        severity === 'all' || a.severity.toLowerCase() === severity;
      return matchesQuery && matchesSeverity;
    });
  }, [query, severity]);

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <div className="alerts-toolbar">
          <h1>Alerts</h1>
          <div className="toolbar-actions">
            <input
              type="text"
              placeholder="Search by ID, IP, or Type"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <div className="severity-filters">
              {['all', 'high', 'medium', 'low'].map((lvl) => (
                <button
                  key={lvl}
                  className={`chip ${severity === lvl ? 'active' : ''}`}
                  onClick={() => setSeverity(lvl)}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <AlertsTable alerts={filtered} />
      </main>
    </div>
  );
};

export default AlertsPage;


