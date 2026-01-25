import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { fetchLogs } from '../services/api';
import './Page.css';
import './LogsPage.css';

const PAGE_SIZE = 10;

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const loadLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        limit: PAGE_SIZE,
        offset,
        source: sourceFilter || undefined,
        severity: severityFilter || undefined,
        start_ts: startDate ? new Date(startDate).toISOString() : undefined,
        end_ts: endDate ? new Date(endDate).toISOString() : undefined
      };
      const logsData = await fetchLogs(params);
      setLogs(logsData);
    } catch (err) {
      setError('Failed to load logs. Check your token or backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadLogs();
  }, [token, offset, sourceFilter, severityFilter, startDate, endDate]);

  const displayLogs = useMemo(() => {
    return logs.map((log) => ({
      id: log.id,
      timestamp: new Date(log.timestamp).toLocaleString(),
      source: log.source,
      severity: log.severity === 'critical' ? 'high' : (log.severity || 'unknown'),
      message: log.message,
      ip: log.metadata?.ip || 'N/A'
    }));
  }, [logs]);

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        {!token && (
          <div className="logs-warning">Please log in to load logs.</div>
        )}
        {error && <div className="logs-warning">{error}</div>}
        <div className="logs-filters">
          <input
            className="logs-filter-input"
            type="text"
            placeholder="Source (e.g., endpoint)"
            value={sourceFilter}
            onChange={(e) => {
              setOffset(0);
              setSourceFilter(e.target.value);
            }}
          />
          <select
            className="logs-filter-select"
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
          <input
            className="logs-filter-input"
            type="datetime-local"
            value={startDate}
            onChange={(e) => {
              setOffset(0);
              setStartDate(e.target.value);
            }}
          />
          <input
            className="logs-filter-input"
            type="datetime-local"
            value={endDate}
            onChange={(e) => {
              setOffset(0);
              setEndDate(e.target.value);
            }}
          />
          <button className="logs-action-btn" onClick={loadLogs}>
            Refresh
          </button>
        </div>
        {isLoading ? (
          <div className="logs-warning">Loading logs...</div>
        ) : (
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>IP</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {displayLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="log-id">{log.id}</td>
                    <td>{log.timestamp}</td>
                    <td>{log.source}</td>
                    <td>{log.severity}</td>
                    <td>{log.ip}</td>
                    <td className="log-message">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="logs-pagination">
          <button
            className="logs-action-btn"
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
          >
            Prev
          </button>
          <span className="pagination-info">
            Page {Math.floor(offset / PAGE_SIZE) + 1}
          </span>
          <button
            className="logs-action-btn"
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={logs.length < PAGE_SIZE}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
};

export default LogsPage;



