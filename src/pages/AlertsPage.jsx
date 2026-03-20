import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload } from '@fortawesome/free-solid-svg-icons';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertsTable from '../components/dashboard/AlertsTable';
import { fetchAlerts, fetchLogs } from '../services/api';
import './Page.css';
import './AlertsPage.css';

const PAGE_SIZE = 10;

const AlertsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [logsMap, setLogsMap] = useState(new Map());
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const loadAlerts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [alertsData, logsData] = await Promise.all([
        fetchAlerts({
          limit: PAGE_SIZE,
          offset,
          severity: severityFilter || undefined,
          alert_type: typeFilter || undefined
        }),
        fetchLogs({ limit: 200, offset: 0 })
      ]);
      const map = new Map();
      logsData.forEach((log) => {
        map.set(log.id, log);
      });
      setLogsMap(map);
      setAlerts(alertsData);
    } catch (err) {
      setError('Failed to load alerts. Check your token or backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAlerts();
  }, [token, offset, severityFilter, typeFilter]);

  const displayAlerts = useMemo(() => {
    return alerts.map((alert) => {
      const log = logsMap.get(alert.log_id);
      const sourceIp = log?.metadata?.ip || 'N/A';
      const attackType = alert.classification || alert.alert_type || 'unknown';
      const normalizedSeverity = alert.severity === 'critical' ? 'high' : alert.severity;
      return {
        id: alert.id,
        timestamp: new Date(alert.created_at).toLocaleString(),
        sourceIP: sourceIp,
        attackType,
        severity: normalizedSeverity || 'low',
        status: 'Active',
        description: alert.metadata?.note || alert.metadata?.rule || ''
      };
    });
  }, [alerts, logsMap]);

  const filtered = useMemo(() => {
    if (!searchQuery) return displayAlerts;
    const query = searchQuery.toLowerCase();
    return displayAlerts.filter((a) => 
      a.id.toLowerCase().includes(query) ||
      a.sourceIP.includes(query) ||
      a.attackType.toLowerCase().includes(query) ||
      (a.description && a.description.toLowerCase().includes(query))
    );
  }, [searchQuery, displayAlerts]);

  const handleRefresh = () => {
    loadAlerts();
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
          {!token && (
            <div className="alerts-warning">
              Please log in to load alerts.
            </div>
          )}
          {error && <div className="alerts-warning">{error}</div>}
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
          <div className="alerts-filters">
            <select
              className="alerts-filter-select"
              value={severityFilter}
              onChange={(e) => {
                setOffset(0);
                setSeverityFilter(e.target.value);
              }}
            >
              <option value="">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="alerts-filter-select"
              value={typeFilter}
              onChange={(e) => {
                setOffset(0);
                setTypeFilter(e.target.value);
              }}
            >
              <option value="">All Types</option>
              <option value="known_attack">Known Attack</option>
              <option value="anomaly">Anomaly</option>
              <option value="benign">Benign</option>
            </select>
            <button className="logs-action-btn" onClick={handleRefresh}>
              Refresh
            </button>
          </div>
          <div className="alerts-action-buttons">
            <button className="action-btn" onClick={handleDownloadCSV}>
              <FontAwesomeIcon icon={faDownload} />
              Download CSV
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="alerts-warning">Loading alerts...</div>
        ) : (
          <AlertsTable alerts={filtered} />
        )}
        <div className="alerts-pagination">
          <button
            className="action-btn"
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
          >
            Previous Page
          </button>
          <span className="pagination-info">
            Page {Math.floor(offset / PAGE_SIZE) + 1}
          </span>
          <button
            className="action-btn"
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={alerts.length < PAGE_SIZE}
          >
            Next Page
          </button>
        </div>
      </main>
    </div>
  );
};

export default AlertsPage;
