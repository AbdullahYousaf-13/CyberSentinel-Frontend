import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertCards from '../components/dashboard/AlertCards';
import AlertsTable from '../components/dashboard/AlertsTable';
import AttackChart from '../components/dashboard/AttackChart';
import ThreatPie from '../components/dashboard/ThreatPie';
import { confirmKnownAttack, fetchAlertAnalytics, fetchAlerts, markFalsePositive } from '../services/api';
import { mapAlertToDisplay } from '../utils/securityViewMappers';
import './Dashboard.css';

const PAGE_SIZE = 10;
const ATTACK_TYPE_COLORS = ['#FF4444', '#FF8800', '#FFBB33', '#00C851', '#00E5FF', '#8B5CF6', '#F472B6'];
const DASHBOARD_ALERT_TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'anomaly', label: 'Anomaly' },
  { key: 'known_attack', label: 'Known Attack' }
];

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState({
    severity_counts: { total: 0, high: 0, medium: 0, low: 0 },
    trend: { unit: 'day', points: [] },
    distribution: [],
    window: { start: null, end: null, bucket_unit: 'day' }
  });
  const [page, setPage] = useState(1);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState('');
  const [analyticsError, setAnalyticsError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [activeSeverity, setActiveSeverity] = useState('total');
  const [activeAlertType, setActiveAlertType] = useState('all');
  const [pageInput, setPageInput] = useState('1');
  const token = localStorage.getItem('token');
  const offset = (page - 1) * PAGE_SIZE;

  const loadAlerts = useCallback(async () => {
    setIsAlertsLoading(true);
    setAlertsError('');
    try {
      const severity = activeSeverity === 'total' ? undefined : (activeSeverity === 'high' ? 'high' : activeSeverity);
      const alertType = activeAlertType === 'all' ? undefined : activeAlertType;
      const alertsData = await fetchAlerts({ limit: PAGE_SIZE, offset, severity, alert_type: alertType });
      setAlerts(alertsData);
    } catch (err) {
      setAlertsError(`Failed to load dashboard alerts: ${err.message}`);
    } finally {
      setIsAlertsLoading(false);
    }
  }, [offset, activeSeverity, activeAlertType]);

  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const analyticsData = await fetchAlertAnalytics();
      setAnalytics(
        analyticsData || {
          severity_counts: { total: 0, high: 0, medium: 0, low: 0 },
          trend: { unit: 'day', points: [] },
          distribution: [],
          window: { start: null, end: null, bucket_unit: 'day' }
        }
      );
    } catch (err) {
      setAnalyticsError('Analytics is taking too long or failed to load.');
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadAlerts();
  }, [token, loadAlerts]);

  useEffect(() => {
    if (!token) return;
    loadAnalytics();
  }, [token, loadAnalytics]);

  const displayAlerts = useMemo(() => alerts.map((alert) => mapAlertToDisplay(alert)), [alerts]);
  const alertStats = useMemo(
    () => analytics?.severity_counts || { total: 0, high: 0, medium: 0, low: 0 },
    [analytics]
  );
  const totalAlertsForActiveFilter = useMemo(() => {
    if (activeSeverity === 'total') return alertStats.total || 0;
    if (activeSeverity === 'high') return alertStats.high || 0;
    if (activeSeverity === 'medium') return alertStats.medium || 0;
    return alertStats.low || 0;
  }, [activeSeverity, alertStats]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalAlertsForActiveFilter / PAGE_SIZE)),
    [totalAlertsForActiveFilter]
  );

  const attackTrendsData = useMemo(() => {
    const points = analytics?.trend?.points || [];
    return points.map((point) => ({
      time: point.label,
      attacks: point.count
    }));
  }, [analytics]);

  const attackTypeDistribution = useMemo(() => {
    const categories = analytics?.distribution || [];
    return categories.map((entry, index) => ({
      name: entry.label,
      value: entry.count,
      color: ATTACK_TYPE_COLORS[index % ATTACK_TYPE_COLORS.length]
    }));
  }, [analytics]);

  const handleConfirmKnown = async (alert) => {
    const defaultValue = (alert.classification && alert.classification !== 'N/A')
      ? alert.classification
      : 'PORTSCAN';
    const classification = window.prompt('Enter known attack label (e.g., PORTSCAN, SQL_INJECTION_ATTEMPT):', defaultValue);
    if (!classification) return;
    try {
      await confirmKnownAttack(alert.id, { classification: classification.trim() });
      setActionMessage(`Alert ${alert.id} marked as known attack.`);
      await loadAlerts();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(`Failed to mark alert: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const handleMarkFalsePositive = async (alert) => {
    const notes = window.prompt('Optional notes for this false-positive suppression:', '');
    if (notes === null) return;
    try {
      await markFalsePositive(alert.id, { notes: notes.trim() || undefined });
      setActionMessage(`Alert ${alert.id} marked false positive and suppression enabled.`);
      await loadAlerts();
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      setActionMessage(`Failed to mark false positive: ${err.message}`);
      setTimeout(() => setActionMessage(''), 4500);
    }
  };

  const handlePageInputSubmit = () => {
    const parsedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsedPage)) {
      setPageInput(String(page));
      return;
    }
    const clampedPage = Math.min(totalPages, Math.max(1, parsedPage));
    setPage(clampedPage);
  };

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="dashboard-layout dashboard-page-layout">
      <Header />
      <Sidebar />
      <main className="main-content dashboard-main-content">
        {alertsError && <div className="dashboard-warning">{alertsError}</div>}
        {analyticsError && <div className="dashboard-warning">{analyticsError}</div>}
        {actionMessage && <div className="dashboard-warning">{actionMessage}</div>}
        <AlertCards
          stats={alertStats}
          activeFilter={activeSeverity}
          onSelect={(key) => {
            setPage(1);
            setActiveSeverity(key);
          }}
        />
        <div className="dashboard-filter-bar" role="group" aria-label="Alert type filters">
          {DASHBOARD_ALERT_TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`dashboard-filter-chip ${activeAlertType === filter.key ? 'active' : ''}`}
              onClick={() => {
                setPage(1);
                setActiveAlertType(filter.key);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {isAlertsLoading ? (
          <div className="dashboard-warning">Loading alerts...</div>
        ) : (
          <AlertsTable
            alerts={displayAlerts}
            showSeverity
            onConfirmKnown={handleConfirmKnown}
            onMarkFalsePositive={handleMarkFalsePositive}
          />
        )}
        <div className="dashboard-controls">
          <button className="dashboard-btn" onClick={loadAlerts}>
            Refresh
          </button>
          <button className="dashboard-btn" onClick={loadAnalytics}>
            Refresh Analytics
          </button>
          <button
            className="dashboard-btn"
            onClick={() => setPage((previousPage) => Math.max(1, previousPage - 1))}
            disabled={page === 1}
          >
            Previous Page
          </button>
          <span className="dashboard-page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="dashboard-btn"
            onClick={() => setPage((previousPage) => Math.min(totalPages, previousPage + 1))}
            disabled={page >= totalPages}
          >
            Next Page
          </button>
          <div className="dashboard-page-jump">
            <label className="dashboard-page-jump-label" htmlFor="dashboard-page-input">Go to</label>
            <input
              id="dashboard-page-input"
              className="dashboard-page-jump-input"
              type="number"
              min="1"
              max={totalPages}
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePageInputSubmit();
                }
              }}
            />
            <button className="dashboard-btn" onClick={handlePageInputSubmit}>
              Go
            </button>
          </div>
        </div>
        <div className="charts-container">
          {isAnalyticsLoading && <div className="dashboard-warning">Loading analytics...</div>}
          <AttackChart data={attackTrendsData} />
          <ThreatPie data={attackTypeDistribution} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


