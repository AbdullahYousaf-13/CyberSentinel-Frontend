import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { fetchLogCount, fetchLogs } from '../services/api';
import './Page.css';
import './Dashboard.css';
import './LogsPage.css';

const COMPACT_LOG_BREAKPOINT = 960;
const TABLE_ROW_HEIGHT = 56;
const SOURCE_FILTER_DEBOUNCE_MS = 350;

const getResponsivePageSize = (width, height) => {
  if (width <= 640) return 8;
  if (width <= COMPACT_LOG_BREAKPOINT) return 10;

  // Favor keeping the full logs page within a typical laptop viewport.
  const reservedHeight = height <= 800 ? 420 : height <= 920 ? 390 : 360;
  const estimatedRows = Math.floor(Math.max(260, height - reservedHeight) / TABLE_ROW_HEIGHT);
  const minRows = height <= 820 ? 5 : 6;
  const maxRows = height >= 1080 ? 12 : 10;
  return Math.min(maxRows, Math.max(minRows, estimatedRows));
};

const normalizeSeverity = (severity) => {
  if (!severity) return 'unknown';
  return severity.toLowerCase() === 'critical' ? 'high' : severity.toLowerCase();
};

const formatSeverity = (severity) => {
  const normalizedSeverity = normalizeSeverity(severity);
  return normalizedSeverity.charAt(0).toUpperCase() + normalizedSeverity.slice(1);
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('');
  const [debouncedSourceFilter, setDebouncedSourceFilter] = useState('');
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
  const [isCompactScreen, setIsCompactScreen] = useState(
    () => (typeof window === 'undefined' ? false : window.innerWidth <= COMPACT_LOG_BREAKPOINT)
  );
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const hasActiveFilters = Boolean(sourceFilter || severityFilter || startDate || endDate);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalLogs / pageSize)),
    [totalLogs, pageSize]
  );
  const offset = (page - 1) * pageSize;

  useEffect(() => {
    const normalizedSourceFilter = sourceFilter.trim();
    if (!normalizedSourceFilter) {
      setDebouncedSourceFilter('');
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSourceFilter(normalizedSourceFilter);
    }, SOURCE_FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [sourceFilter]);

  const loadLogs = useCallback(async (overrides = {}) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const params = {
        limit: pageSize,
        offset,
        source: (overrides.source ?? debouncedSourceFilter) || undefined,
        severity: (overrides.severity ?? severityFilter) || undefined,
        start_ts: (overrides.startDate ?? startDate)
          ? new Date(overrides.startDate ?? startDate).toISOString()
          : undefined,
        end_ts: (overrides.endDate ?? endDate)
          ? new Date(overrides.endDate ?? endDate).toISOString()
          : undefined
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
  }, [token, pageSize, offset, debouncedSourceFilter, severityFilter, startDate, endDate, page]);

  useEffect(() => {
    if (!token) return;
    loadLogs();
  }, [token, loadLogs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => {
      setIsCompactScreen(window.innerWidth <= COMPACT_LOG_BREAKPOINT);
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
      timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
      source: log.source || 'Unknown source',
      severity: normalizeSeverity(log.severity),
      severityLabel: formatSeverity(log.severity),
      message: log.message || 'No message available.',
      ip: log.metadata?.ip || 'N/A'
    }));
  }, [logs]);

  const pageSummaryText = useMemo(() => {
    if (totalLogs === 0 || displayLogs.length === 0) {
      return 'No logs available';
    }

    const startIndex = offset + 1;
    const endIndex = Math.min(totalLogs, offset + displayLogs.length);
    return `Showing ${startIndex}-${endIndex} of ${totalLogs} logs`;
  }, [displayLogs.length, offset, totalLogs]);

  const handleClearFilters = () => {
    const shouldReloadImmediately =
      !sourceFilter && !severityFilter && !startDate && !endDate && page === 1;

    setSourceFilter('');
    setDebouncedSourceFilter('');
    setSeverityFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);

    if (shouldReloadImmediately) {
      loadLogs();
    }
  };

  return (
    <div className="dashboard-layout dashboard-page-layout">
      <Header />
      <Sidebar />
      <main className="main-content dashboard-main-content logs-main-content">
        {!token && (
          <div className="dashboard-warning">Please log in to load logs.</div>
        )}
        {error && <div className="dashboard-warning">{error}</div>}

        <section className="logs-panel logs-filter-panel">
          <div className="logs-panel-header">
            <div>
              <h2 className="logs-section-title">Filters</h2>
              <p className="logs-section-copy">
                Narrow the feed by source, severity, and time range.
              </p>
            </div>
            <div className="logs-filter-actions">
              <button
                className="dashboard-btn"
                type="button"
                onClick={() => {
                  const immediateSourceFilter = sourceFilter.trim();
                  setDebouncedSourceFilter(immediateSourceFilter);
                  loadLogs({ source: immediateSourceFilter });
                }}
                disabled={!token || isLoading}
              >
                Refresh
              </button>
              <button
                className="dashboard-btn logs-clear-btn"
                type="button"
                onClick={handleClearFilters}
                disabled={!token || isLoading || !hasActiveFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="logs-filters-grid">
            <label className="logs-filter-field">
              <span>Source</span>
              <input
                className="logs-filter-input"
                type="text"
                placeholder="endpoint"
                value={sourceFilter}
                disabled={!token}
                onChange={(e) => {
                  setPage(1);
                  setSourceFilter(e.target.value);
                }}
              />
            </label>
            <label className="logs-filter-field">
              <span>Severity</span>
              <select
                className="logs-filter-select"
                value={severityFilter}
                disabled={!token}
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
            </label>
            <label className="logs-filter-field">
              <span>Start</span>
              <input
                className="logs-filter-input"
                type="datetime-local"
                value={startDate}
                disabled={!token}
                onChange={(e) => {
                  setPage(1);
                  setStartDate(e.target.value);
                }}
              />
            </label>
            <label className="logs-filter-field">
              <span>End</span>
              <input
                className="logs-filter-input"
                type="datetime-local"
                value={endDate}
                disabled={!token}
                onChange={(e) => {
                  setPage(1);
                  setEndDate(e.target.value);
                }}
              />
            </label>
          </div>
        </section>

        <section className="logs-panel logs-results-panel">
          <div className="logs-panel-header">
            <div>
              <h2 className="logs-section-title">Recent Logs</h2>
              <p className="logs-section-copy">
                {isCompactScreen
                  ? 'Smaller screens switch to stacked cards so the message preview stays readable.'
                  : 'Larger screens keep the wider table layout for faster scanning.'}
              </p>
            </div>
            <div className="logs-results-meta">{pageSummaryText}</div>
          </div>
          {isLoading ? (
            <div className="dashboard-warning logs-inline-warning">Loading logs...</div>
          ) : displayLogs.length === 0 ? (
            <div className="logs-empty-state">
              {token ? 'No logs found for the selected filters.' : 'Log access requires an active session.'}
            </div>
          ) : isCompactScreen ? (
            <div className="logs-card-list">
              {displayLogs.map((log) => (
                <article key={log.id} className={`logs-card logs-card-${log.severity}`}>
                  <div className="logs-card-top">
                    <div className="logs-card-meta">
                      <span className="logs-card-label">Log ID</span>
                      <span className="logs-card-id">{log.id}</span>
                    </div>
                    <span className={`logs-severity-badge logs-severity-${log.severity}`}>
                      {log.severityLabel}
                    </span>
                  </div>
                  <div className="logs-card-grid">
                    <div className="logs-card-field">
                      <span className="logs-card-label">Timestamp</span>
                      <span className="logs-card-value">{log.timestamp}</span>
                    </div>
                    <div className="logs-card-field">
                      <span className="logs-card-label">Source</span>
                      <span className="logs-card-value">{log.source}</span>
                    </div>
                    <div className="logs-card-field">
                      <span className="logs-card-label">IP</span>
                      <span className="logs-card-value">{log.ip}</span>
                    </div>
                  </div>
                  <div className="logs-card-message">
                    <span className="logs-card-label">Message</span>
                    <p>{log.message}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="logs-table-shell">
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
                        <td>
                          <span className={`logs-severity-badge logs-severity-${log.severity}`}>
                            {log.severityLabel}
                          </span>
                        </td>
                        <td>{log.ip}</td>
                        <td className="log-message">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <div className="dashboard-controls logs-pagination">
          <button
            className="dashboard-btn"
            type="button"
            onClick={() => setPage((previousPage) => Math.max(1, previousPage - 1))}
            disabled={page === 1 || isLoading}
          >
            Prev
          </button>
          <span className="dashboard-page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="dashboard-btn"
            type="button"
            onClick={() => setPage((previousPage) => Math.min(totalPages, previousPage + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
};

export default LogsPage;



