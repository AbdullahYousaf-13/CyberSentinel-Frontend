import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertCards from '../components/dashboard/AlertCards';
import AlertsTable from '../components/dashboard/AlertsTable';
import AttackChart from '../components/dashboard/AttackChart';
import ThreatPie from '../components/dashboard/ThreatPie';
import { confirmKnownAttack, fetchAlertAnalytics, fetchAlertCount, fetchAlerts, markFalsePositive } from '../services/api';
import { mapAlertToDisplay } from '../utils/securityViewMappers';
import './Dashboard.css';

const PAGE_SIZE = 10;
const ATTACK_TYPE_COLORS = ['#FF4444', '#FF8800', '#FFBB33', '#00C851', '#00E5FF', '#8B5CF6', '#F472B6'];

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState({
    trend: { unit: 'day', points: [] },
    distribution: [],
    severity_counts: { high: 0, medium: 0, low: 0 },
    total_alerts: 0
  });
  const [alertTotal, setAlertTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [activeSeverity, setActiveSeverity] = useState('total');
  const token = localStorage.getItem('token');

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const severityFilter = activeSeverity !== 'total' ? activeSeverity : undefined;
      const [alertsData, alertCountData, analyticsData] = await Promise.all([
        fetchAlerts({ limit: PAGE_SIZE, offset, severity: severityFilter }),
        fetchAlertCount({ severity: severityFilter }),
        fetchAlertAnalytics()
      ]);
      setAlerts(alertsData || []);
      setAlertTotal(typeof alertCountData?.total === 'number' ? alertCountData.total : 0);
      setAnalytics(
        analyticsData || {
          trend: { unit: 'day', points: [] },
          distribution: [],
          severity_counts: { high: 0, medium: 0, low: 0 },
          total_alerts: 0
        }
      );
    } catch (err) {
      setError('Failed to load dashboard alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSeverity, offset]);

  useEffect(() => {
    if (!token) return;
    loadAlerts();
  }, [token, loadAlerts]);

  const displayAlerts = useMemo(() => {
    return alerts.map((alert) => mapAlertToDisplay(alert));
  }, [alerts]);

  const alertStats = useMemo(() => {
    const counts = analytics?.severity_counts || {};
    return {
      total: analytics?.total_alerts || 0,
      high: counts.high || 0,
      medium: counts.medium || 0,
      low: counts.low || 0
    };
  }, [analytics]);

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

  return (
    <div className="dashboard-layout dashboard-page-layout">
      <Header />
      <Sidebar />
      <main className="main-content dashboard-main-content">
        {error && <div className="dashboard-warning">{error}</div>}
        {actionMessage && <div className="dashboard-warning">{actionMessage}</div>}
        <AlertCards
          stats={alertStats}
          activeFilter={activeSeverity}
          onSelect={(key) => {
            setOffset(0);
            setActiveSeverity(key);
          }}
        />
        {isLoading ? (
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
          <button
            className="dashboard-btn"
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
          >
            Previous Page
          </button>
          <span className="dashboard-page-info">
            Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.max(1, Math.ceil(alertTotal / PAGE_SIZE))}
          </span>
          <button
            className="dashboard-btn"
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= alertTotal}
          >
            Next Page
          </button>
        </div>
        <div className="charts-container">
          <AttackChart data={attackTrendsData} />
          <ThreatPie data={attackTypeDistribution} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


