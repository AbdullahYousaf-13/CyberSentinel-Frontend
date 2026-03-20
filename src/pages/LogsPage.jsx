import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { fetchLogCount, fetchLogs } from '../services/api';
import './Page.css';
import './LogsPage.css';

const getResponsivePageSize = (width, height) => {
  if (width <= 640) return 5;

  // Estimate visible rows from viewport height so taller screens show more logs.
  const reservedHeight = 290; // header + filters + pagination + spacing
  const estimatedRows = Math.floor(Math.max(280, height - reservedHeight) / 46);
  const minRows = width <= 1024 ? 7 : 8;
  return Math.min(20, Math.max(minRows, estimatedRows));
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() =>
    getResponsivePageSize(
      typeof window === 'undefined' ? 1280 : window.innerWidth,
      typeof window === 'undefined' ? 800 : window.innerHeight
    )
  );
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalLogs / pageSize)),
    [totalLogs, pageSize]
  );
  const offset = (page - 1) * pageSize;

  const loadLogs = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const params = {
        limit: pageSize,
        offset,
        source: sourceFilter || undefined,
        severity: severityFilter || undefined,
        start_ts: startDate ? new Date(startDate).toISOString() : undefined,
        end_ts: endDate ? new Date(endDate).toISOString() : undefined
      };
      const [logsData, countData] = await Promise.all([
        fetchLogs(params),
        fetchLogCount({
          source: params.source,
          severity: params.severity,
          start_ts: params.start_ts,
          end_ts: params.end_ts
        })
      ]);
      const nextTotalLogs = countData?.total || 0;
      const nextTotalPages = Math.max(1, Math.ceil(nextTotalLogs / pageSize));
      setLogs(logsData);
      setTotalLogs(nextTotalLogs);
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }
    } catch (err) {
      setError('Failed to load logs. Check your token or backend status.');
    } finally {
      setIsLoading(false);
    }
  }, [token, pageSize, offset, sourceFilter, severityFilter, startDate, endDate, page]);

  useEffect(() => {
    if (!token) return;
    loadLogs();
  }, [token, loadLogs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => {
      const nextPageSize = getResponsivePageSize(window.innerWidth, window.innerHeight);
      setPageSize((previousPageSize) => {
        if (previousPageSize === nextPageSize) {
          return previousPageSize;
        }
        const firstVisibleIndex = (page - 1) * previousPageSize;
        setPage(Math.floor(firstVisibleIndex / nextPageSize) + 1);
        return nextPageSize;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [page]);

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
      <main className="main-content logs-main-content">
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
              setPage(1);
              setSourceFilter(e.target.value);
            }}
          />
          <select
            className="logs-filter-select"
            value={severityFilter}
            onChange={(e) => {
              setPage(1);
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
              setPage(1);
              setStartDate(e.target.value);
            }}
          />
          <input
            className="logs-filter-input"
            type="datetime-local"
            value={endDate}
            onChange={(e) => {
              setPage(1);
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
                {displayLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="logs-empty">
                      No logs found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  displayLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-id">{log.id}</td>
                      <td>{log.timestamp}</td>
                      <td>{log.source}</td>
                      <td>{log.severity}</td>
                      <td>{log.ip}</td>
                      <td className="log-message">{log.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="logs-pagination">
          <button
            className="logs-action-btn"
            onClick={() => setPage((previousPage) => Math.max(1, previousPage - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="logs-action-btn"
            onClick={() => setPage((previousPage) => Math.min(totalPages, previousPage + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
};

export default LogsPage;



