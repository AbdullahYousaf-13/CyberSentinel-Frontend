import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertCards from '../components/dashboard/AlertCards';
import AlertsTable from '../components/dashboard/AlertsTable';
import AttackChart from '../components/dashboard/AttackChart';
import ThreatPie from '../components/dashboard/ThreatPie';
import { confirmKnownAttack, fetchAlertAnalytics, fetchAlerts, fetchLogs, markFalsePositive } from '../services/api';
import { mapAlertToDisplay } from '../utils/securityViewMappers';
import './Dashboard.css';

const PAGE_SIZE = 10;
const ATTACK_TYPE_COLORS = ['#FF4444', '#FF8800', '#FFBB33', '#00C851', '#00E5FF', '#8B5CF6', '#F472B6'];

const Dashboard = () => {
  const [allAlerts, setAllAlerts] = useState([]);
  const [logsMap, setLogsMap] = useState(new Map());
  const [analytics, setAnalytics] = useState({
    trend: { unit: 'day', points: [] },
    distribution: []
  });
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [activeSeverity, setActiveSeverity] = useState('total');
  const token = localStorage.getItem('token');

  const fetchAllAlerts = useCallback(async () => {
    const BATCH_SIZE = 200;
    const MAX_BATCHES = 50;
    let currentOffset = 0;
    let batches = 0;
    const collected = [];

    while (batches < MAX_BATCHES) {
      const chunk = await fetchAlerts({ limit: BATCH_SIZE, offset: currentOffset });
      collected.push(...chunk);
      if (chunk.length < BATCH_SIZE) break;
      currentOffset += BATCH_SIZE;
      batches += 1;
    }
    return collected;
  }, []);

  const fetchAllLogs = useCallback(async () => {
    const BATCH_SIZE = 200;
    const MAX_BATCHES = 50;
    let currentOffset = 0;
    let batches = 0;
    const collected = [];

    while (batches < MAX_BATCHES) {
      const chunk = await fetchLogs({ limit: BATCH_SIZE, offset: currentOffset });
      collected.push(...chunk);
      if (chunk.length < BATCH_SIZE) break;
      currentOffset += BATCH_SIZE;
      batches += 1;
    }
    return collected;
  }, []);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [alertsData, logsData, analyticsData] = await Promise.all([
        fetchAllAlerts(),
        fetchAllLogs(),
        fetchAlertAnalytics()
      ]);
      const map = new Map();
      logsData.forEach((log) => {
        map.set(log.id, log);
      });
      setLogsMap(map);
      setAllAlerts(alertsData);
      setAnalytics(
        analyticsData || {
          trend: { unit: 'day', points: [] },
          distribution: []
        }
      );
    } catch (err) {
      setError('Failed to load dashboard alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllAlerts, fetchAllLogs]);

  useEffect(() => {
    if (!token) return;
    loadAlerts();
  }, [token, loadAlerts]);

  const displayAlerts = useMemo(() => {
    return allAlerts.map((alert) => {
      return mapAlertToDisplay(alert, logsMap.get(alert.log_id));
    });
  }, [allAlerts, logsMap]);

  const filteredAlerts = useMemo(() => {
    if (activeSeverity === 'total') return displayAlerts;
    if (activeSeverity === 'high') {
      return displayAlerts.filter((alert) =>
        ['high', 'critical'].includes(alert.severity.toLowerCase())
      );
    }
    return displayAlerts.filter(
      (alert) => alert.severity.toLowerCase() === activeSeverity
    );
  }, [displayAlerts, activeSeverity]);

  const pagedAlerts = useMemo(() => {
    return filteredAlerts.slice(offset, offset + PAGE_SIZE);
  }, [filteredAlerts, offset]);

  const alertStats = useMemo(() => {
    const stats = { total: 0, high: 0, medium: 0, low: 0 };
    allAlerts.forEach((alert) => {
      stats.total += 1;
      const severity = (alert.severity || '').toLowerCase();
      if (severity === 'high' || severity === 'critical') stats.high += 1;
      else if (severity === 'medium') stats.medium += 1;
      else stats.low += 1;
    });
    return stats;
  }, [allAlerts]);

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
            alerts={pagedAlerts}
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
            Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE))}
          </span>
          <button
            className="dashboard-btn"
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= filteredAlerts.length}
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


