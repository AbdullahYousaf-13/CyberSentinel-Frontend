import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertCards from '../components/dashboard/AlertCards';
import AlertsTable from '../components/dashboard/AlertsTable';
import AttackChart from '../components/dashboard/AttackChart';
import ThreatPie from '../components/dashboard/ThreatPie';
import { fetchAlerts, fetchLogs } from '../services/api';
import { attackTrendsData, attackTypeDistribution } from '../data/mockData';
import { mapAlertToDisplay } from '../utils/securityViewMappers';
import './Dashboard.css';

const PAGE_SIZE = 10;

const Dashboard = () => {
  const [allAlerts, setAllAlerts] = useState([]);
  const [logsMap, setLogsMap] = useState(new Map());
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSeverity, setActiveSeverity] = useState('total');
  const token = localStorage.getItem('token');

  const fetchAllAlerts = async () => {
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
  };

  const fetchAllLogs = async () => {
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
  };

  const loadAlerts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [alertsData, logsData] = await Promise.all([
        fetchAllAlerts(),
        fetchAllLogs()
      ]);
      const map = new Map();
      logsData.forEach((log) => {
        map.set(log.id, log);
      });
      setLogsMap(map);
      setAllAlerts(alertsData);
    } catch (err) {
      setError('Failed to load dashboard alerts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAlerts();
  }, [token]);

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

  return (
    <div className="dashboard-layout dashboard-page-layout">
      <Header />
      <Sidebar />
      <main className="main-content dashboard-main-content">
        {error && <div className="dashboard-warning">{error}</div>}
        <AlertCards
          stats={alertStats}
          activeFilter={activeSeverity}
          onSelect={(key) => {
            setOffset(0);
            setActiveSeverity(key);
          }}
        />
        {isLoading ? <div className="dashboard-warning">Loading alerts...</div> : <AlertsTable alerts={pagedAlerts} />}
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


