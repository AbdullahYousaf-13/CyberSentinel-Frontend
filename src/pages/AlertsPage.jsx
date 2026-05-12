import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload } from '@fortawesome/free-solid-svg-icons';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertsTable from '../components/dashboard/AlertsTable';
import { confirmKnownAttack, fetchAlerts, fetchMe, markFalsePositive } from '../services/api';
import { mapAlertToDisplay } from '../utils/securityViewMappers';
import './Page.css';
import './AlertsPage.css';

const PAGE_SIZE = 10;

const AlertsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem('token');

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const alertsData = await fetchAlerts({
        limit: PAGE_SIZE,
        offset,
        severity: severityFilter || undefined,
        alert_type: typeFilter || undefined
      });
      setAlerts(alertsData);
      try {
        const me = await fetchMe();
        setIsAdmin(Boolean(me && me.is_admin));
      } catch (_err) {
        setIsAdmin(false);
      }
    } catch (err) {
      setError(`Failed to load alerts: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [offset, severityFilter, typeFilter]);

  useEffect(() => {
    if (!token) return;
    loadAlerts();
  }, [token, loadAlerts]);

  const displayAlerts = useMemo(() => {
    return alerts.map((alert) => mapAlertToDisplay(alert));
  }, [alerts]);

  const filtered = useMemo(() => {
    if (!searchQuery) return displayAlerts;
    const query = searchQuery.toLowerCase();
    return displayAlerts.filter((a) => 
      a.id.toLowerCase().includes(query) ||
      a.incidentId.toLowerCase().includes(query) ||
      a.alertType.toLowerCase().includes(query) ||
      a.classification.toLowerCase().includes(query) ||
      a.severity.toLowerCase().includes(query) ||
      a.modelVersion.toLowerCase().includes(query) ||
      a.aiScore.toLowerCase().includes(query) ||
      a.sourceIp.toLowerCase().includes(query) ||
      a.destinationIp.toLowerCase().includes(query)
    );
  }, [searchQuery, displayAlerts]);

  const handleRefresh = () => {
    loadAlerts();
  };

  const handleConfirmKnown = async (alert) => {
    const defaultValue = (alert.classification && alert.classification !== 'N/A')
      ? alert.classification
      : 'PORTSCAN';
    const classification = window.prompt('Enter known attack label (e.g., PORTSCAN, SQL_INJECTION_ATTEMPT):', defaultValue);
    if (!classification) return;
    try {
      await confirmKnownAttack(alert.id, { classification: classification.trim() });
      setActionMessage(`Incident ${alert.incidentId} marked as known attack.`);
      await loadAlerts();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(`Failed to mark alert: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const handleDownloadCSV = () => {
    // CSV download logic
    const csvContent = [
      ['Incident ID', 'Opened At', 'Last Seen', 'Event Count', 'Alert Type', 'Classification', 'Source IP', 'Destination IP', 'Severity', 'AI Score', 'Model Version'].join(','),
      ...filtered.map(a => [
        a.incidentId,
        a.detectedAt,
        a.lastSeenAt,
        a.eventCount,
        a.alertType,
        a.classification,
        a.sourceIp,
        a.destinationIp,
        a.severity,
        a.aiScore,
        a.modelVersion
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

  const handleMarkFalsePositive = async (alert) => {
    const notes = window.prompt('Optional notes for this false-positive suppression:', '');
    if (notes === null) return;
    try {
      await markFalsePositive(alert.id, { notes: notes.trim() || undefined });
      setActionMessage(`Incident ${alert.incidentId} marked false positive and suppression enabled.`);
      await loadAlerts();
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      setActionMessage(`Failed to mark false positive: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4500);
    }
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
          {actionMessage && <div className="alerts-warning">{actionMessage}</div>}
          <div className="alerts-search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by incident ID, type, source/destination IP, classification, severity, score, or model"
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
          <AlertsTable
            alerts={filtered}
            showSeverity
            isAdmin={isAdmin}
            onConfirmKnown={handleConfirmKnown}
            onMarkFalsePositive={handleMarkFalsePositive}
          />
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
