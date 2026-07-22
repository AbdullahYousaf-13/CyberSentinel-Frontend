import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLogCount, fetchLogs } from '../services/api';
import { mapLogToDisplay } from '../utils/securityViewMappers';
import './Page.css';
import './Dashboard.css';
import './LogsPage.css';

const COMPACT_LOG_BREAKPOINT = 960;
const LOGS_PAGE_SIZE = 10;

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [sourceAppFilter, setSourceAppFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const pageSize = LOGS_PAGE_SIZE;
  const [isCompactScreen, setIsCompactScreen] = useState(
    () => (typeof window === 'undefined' ? false : window.innerWidth <= COMPACT_LOG_BREAKPOINT)
  );
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const hasActiveFilters = Boolean(sourceAppFilter || channelFilter || startDate || endDate);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalLogs / pageSize)),
    [totalLogs, pageSize]
  );
  const offset = (page - 1) * pageSize;

  const loadLogs = useCallback(async (overrides = {}) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const params = {
        limit: pageSize,
        offset,
        source_app: (overrides.sourceApp ?? sourceAppFilter) || undefined,
        channel: (overrides.channel ?? channelFilter) || undefined,
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
          source_app: params.source_app,
          channel: params.channel,
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
  }, [token, pageSize, offset, sourceAppFilter, channelFilter, startDate, endDate, page]);

  useEffect(() => {
    if (!token) return;
    loadLogs();
  }, [token, loadLogs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => {
      setIsCompactScreen(window.innerWidth <= COMPACT_LOG_BREAKPOINT);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const displayLogs = useMemo(() => logs.map(mapLogToDisplay), [logs]);

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
      !sourceAppFilter && !channelFilter && !startDate && !endDate && page === 1;

    setSourceAppFilter('');
    setChannelFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);

    if (shouldReloadImmediately) {
      loadLogs();
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

  return (
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
                Narrow archive events by source app, channel, and time range.
              </p>
            </div>
            <div className="logs-filter-actions">
              <button
                className="dashboard-btn"
                type="button"
                onClick={() => loadLogs()}
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
              <span>Source App</span>
              <select
                className="logs-filter-select"
                value={sourceAppFilter}
                disabled={!token}
                onChange={(e) => {
                  setPage(1);
                  setSourceAppFilter(e.target.value);
                }}
              >
                <option value="">All source apps</option>
                <option value="Authentication">Authentication</option>
                <option value="System">System</option>
                <option value="General System">General System</option>
              </select>
            </label>
            <label className="logs-filter-field">
              <span>Channel</span>
              <select
                className="logs-filter-select"
                value={channelFilter}
                disabled={!token}
                onChange={(e) => {
                  setPage(1);
                  setChannelFilter(e.target.value);
                }}
              >
                <option value="">All channels</option>
                <option value="Network">Network</option>
                <option value="Login">Login</option>
                <option value="File">File</option>
                <option value="System">System</option>
                <option value="General">General</option>
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
                <article key={log.id} className="logs-card">
                  <div className="logs-card-top">
                    <div className="logs-card-meta">
                      <span className="logs-card-label">Event ID</span>
                      <span className="logs-card-id">{log.eventId}</span>
                    </div>
                  </div>
                  <div className="logs-card-grid">
                    <div className="logs-card-field">
                      <span className="logs-card-label">Event Time</span>
                      <span className="logs-card-value">{log.eventTime}</span>
                    </div>
                    <div className="logs-card-field">
                      <span className="logs-card-label">Source App</span>
                      <span className="logs-card-value">{log.sourceApp}</span>
                    </div>
                    <div className="logs-card-field">
                      <span className="logs-card-label">Source</span>
                      <span className="logs-card-value">{log.sourceIp}</span>
                    </div>
                    <div className="logs-card-field">
                      <span className="logs-card-label">Destination</span>
                      <span className="logs-card-value">{log.destinationIp}</span>
                    </div>
                    <div className="logs-card-field">
                      <span className="logs-card-label">Channel</span>
                      <span className="logs-card-value">{log.channel}</span>
                    </div>
                  </div>
                  <div className="logs-card-message">
                    <span className="logs-card-label">Message</span>
                    <p title={log.messageFull}>{log.message}</p>
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
                      <th>Event ID</th>
                      <th>Event Time</th>
                      <th>Source App</th>
                      <th>Source</th>
                      <th>Destination</th>
                      <th>Channel</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="log-id">{log.eventId}</td>
                        <td>{log.eventTime}</td>
                        <td>{log.sourceApp}</td>
                        <td>{log.sourceIp}</td>
                        <td>{log.destinationIp}</td>
                        <td>{log.channel}</td>
                        <td className="log-message" title={log.messageFull}>{log.message}</td>
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
          <div className="dashboard-page-jump">
            <label className="dashboard-page-jump-label" htmlFor="logs-page-input">Go to</label>
            <input
              id="logs-page-input"
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
              disabled={isLoading}
            />
            <button
              className="dashboard-btn"
              type="button"
              onClick={handlePageInputSubmit}
              disabled={isLoading}
            >
              Go
            </button>
          </div>
      </div>
    </main>
  );
};

export default LogsPage;
