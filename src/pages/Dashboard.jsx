import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertCards from '../components/dashboard/AlertCards';
import AlertsTable from '../components/dashboard/AlertsTable';
import AttackChart from '../components/dashboard/AttackChart';
import ThreatPie from '../components/dashboard/ThreatPie';
import { fetchAlerts, fetchLogs } from '../services/api';
import { attackTrendsData, attackTypeDistribution } from '../data/mockData';
import './Dashboard.css';

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [logsMap, setLogsMap] = useState(new Map());
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const loadAlerts = async () => {
    setError('');
    try {
      const [alertsData, logsData] = await Promise.all([
        fetchAlerts({ limit: 10, offset: 0 }),
        fetchLogs({ limit: 200, offset: 0 })
      ]);
      const map = new Map();
      logsData.forEach((log) => {
        map.set(log.id, log);
      });
      setLogsMap(map);
      setAlerts(alertsData);
    } catch (err) {
      setError('Failed to load dashboard alerts.');
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAlerts();
  }, [token]);

  const displayAlerts = useMemo(() => {
    return alerts.map((alert) => {
      const log = logsMap.get(alert.log_id);
      const sourceIp = log?.metadata?.ip || 'N/A';
      const attackType = alert.classification || alert.alert_type || 'unknown';
      return {
        id: alert.id,
        timestamp: new Date(alert.created_at).toLocaleString(),
        sourceIP: sourceIp,
        attackType,
        severity: alert.severity || 'low',
        status: 'Active',
        description: alert.metadata?.note || alert.metadata?.rule || ''
      };
    });
  }, [alerts, logsMap]);

  const alertStats = useMemo(() => {
    const stats = { total: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach((alert) => {
      stats.total += 1;
      const severity = (alert.severity || '').toLowerCase();
      if (severity === 'high' || severity === 'critical') stats.high += 1;
      else if (severity === 'medium') stats.medium += 1;
      else stats.low += 1;
    });
    return stats;
  }, [alerts]);

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        {error && <div className="dashboard-warning">{error}</div>}
        <AlertCards stats={alertStats} />
        <AlertsTable alerts={displayAlerts} />
        <div className="charts-container">
          <AttackChart data={attackTrendsData} />
          <ThreatPie data={attackTypeDistribution} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


