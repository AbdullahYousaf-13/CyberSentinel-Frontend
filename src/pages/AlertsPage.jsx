import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSync, faDownload } from '@fortawesome/free-solid-svg-icons';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertsTable from '../components/dashboard/AlertsTable';
import { mockAlerts, alertStats } from '../data/mockData';
import './Page.css';
import './AlertsPage.css';

const AlertsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery) return mockAlerts;
    const query = searchQuery.toLowerCase();
    return mockAlerts.filter((a) => 
      a.id.toLowerCase().includes(query) ||
      a.sourceIP.includes(query) ||
      a.attackType.toLowerCase().includes(query) ||
      (a.description && a.description.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleRefresh = () => {
    // Refresh logic
    window.location.reload();
  };

  const handleDownloadCSV = () => {
    // CSV download logic
    const csvContent = [
      ['Alert ID', 'Timestamp', 'Source IP', 'Attack Type', 'Severity', 'Status'].join(','),
      ...filtered.map(a => [
        a.id,
        a.timestamp,
        a.sourceIP,
        a.attackType,
        a.severity,
        a.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alerts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content alerts-main">
        <div className="alerts-header">
          <h1>Alerts</h1>
          <div className="alerts-search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by IP Address, Attack Type or details"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="alerts-search-input"
            />
          </div>
          <div className="alerts-action-buttons">
            <button className="action-btn" onClick={handleRefresh}>
              <FontAwesomeIcon icon={faSync} />
              Refresh
            </button>
            <button className="action-btn" onClick={handleDownloadCSV}>
              <FontAwesomeIcon icon={faDownload} />
              Download CSV
            </button>
          </div>
        </div>
        <AlertsTable alerts={filtered} stats={alertStats} />
      </main>
    </div>
  );
};

export default AlertsPage;
