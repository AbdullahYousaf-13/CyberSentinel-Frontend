import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import {
  activateSuppression,
  createRetrainJob,
  deactivateSuppression,
  listSuppressions,
  listModelVersions,
  listRetrainJobs,
  rollbackModelVersion
} from '../services/api';
import './Page.css';
import './Settings.css';

const ACTIVE_RETRAIN_STATUSES = new Set(['queued', 'running']);

const ModelOpsPage = () => {
  const [reason, setReason] = useState('');
  const [jobs, setJobs] = useState([]);
  const [versions, setVersions] = useState([]);
  const [suppressions, setSuppressions] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobRows, versionResp, suppressionRows] = await Promise.all([
        listRetrainJobs({ limit: 20 }),
        listModelVersions(),
        listSuppressions({ limit: 200 })
      ]);
      setJobs(jobRows || []);
      setVersions((versionResp && versionResp.versions) || []);
      setSuppressions(suppressionRows || []);
    } catch (err) {
      setError(err.message || 'Failed to load model operations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStartRetrain = async () => {
    try {
      setError('');
      const payload = { reason: reason.trim() || 'Manual retraining' };
      const created = await createRetrainJob(payload);
      setMessage(`Retrain job queued: ${created.id}`);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to queue retrain job.');
    }
  };

  const handleRollback = async (version) => {
    if (!window.confirm(`Activate model version ${version}?`)) return;
    try {
      setError('');
      await rollbackModelVersion(version);
      setMessage(`Activated version ${version}`);
      await refresh();
    } catch (err) {
      setError(err.message || 'Rollback failed.');
    }
  };

  const handleSuppressionAction = async (fingerprint, active) => {
    try {
      setError('');
      if (active) {
        await deactivateSuppression(fingerprint);
        setMessage(`Suppression deactivated: ${fingerprint.slice(0, 12)}...`);
      } else {
        await activateSuppression(fingerprint);
        setMessage(`Suppression activated: ${fingerprint.slice(0, 12)}...`);
      }
      await refresh();
    } catch (err) {
      setError(err.message || 'Suppression action failed.');
    }
  };

  const formatPct = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return `${(value * 100).toFixed(3)}%`;
  };

  const formatCount = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return value;
  };

  const formatDuration = (start, end) => {
    if (!start) return 'N/A';
    const endTime = end ? new Date(end).getTime() : Date.now();
    const ms = Math.max(0, endTime - new Date(start).getTime());
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${min}m ${rem}s`;
  };

  const renderStatusBadge = (status) => {
    const normalized = String(status || 'unknown').toLowerCase();
    return (
      <span className={`status-badge status-badge-${normalized}`}>
        {normalized}
      </span>
    );
  };

  const renderJobDetails = (job) => {
    const status = String(job.status || '').toLowerCase();
    if (status === 'failed') {
      return job.error || 'Training failed without an error message.';
    }
    if (status === 'succeeded') {
      if (job.result?.version) return `Model version ${job.result.version} is ready.`;
      return 'Training completed successfully.';
    }
    if (status === 'running') {
      return 'Training is in progress.';
    }
    if (status === 'queued') {
      return 'Waiting for the backend worker to start training.';
    }
    return 'No details available.';
  };

  const hasActiveRetrain = jobs.some((job) => ACTIVE_RETRAIN_STATUSES.has(String(job.status || '').toLowerCase()));

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <div className="settings-grid">
          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Model Retraining</h2>
              <p className="muted">Queue manual retraining jobs after anomaly confirmations.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="model-ops-reason-input"
                placeholder="Message.."
                rows={3}
              />
              <div className="settings-actions" style={{ marginTop: '12px' }}>
                <button className="details-btn" onClick={handleStartRetrain} disabled={hasActiveRetrain}>
                  Start Retrain
                </button>
                <button className="details-btn" onClick={refresh} style={{ marginLeft: '8px' }}>Refresh</button>
              </div>
              {loading && <p className="muted">Loading model ops data...</p>}
              {hasActiveRetrain && (
                <p className="muted settings-helper">A retrain job is already active. Refresh to check when it finishes.</p>
              )}
              {message && <p className="form-info">{message}</p>}
              {error && <p className="form-error">{error}</p>}
            </div>
          </section>

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Retrain Jobs</h2>
              {jobs.length === 0 ? (
                <p className="muted">No retrain jobs yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="alerts-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Duration</th>
                        <th>RF Macro Recall</th>
                        <th>RF Macro F1</th>
                        <th>IF Binary Recall</th>
                        <th>IF Binary F1</th>
                        <th>IF Gate Recall</th>
                        <th>IF Gate F1</th>
                        <th>Samples</th>
                        <th>Created</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="alert-id">{job.id}</td>
                          <td>{renderStatusBadge(job.status)}</td>
                          <td>{job.reason}</td>
                          <td>{formatDuration(job.started_at, job.finished_at)}</td>
                          <td>{formatPct(job.metrics?.rf_macro_recall)}</td>
                          <td>{formatPct(job.metrics?.rf_macro_f1)}</td>
                          <td>{formatPct(job.metrics?.iforest_binary_recall)}</td>
                          <td>{formatPct(job.metrics?.iforest_binary_f1)}</td>
                          <td>{formatPct(job.metrics?.iforest_gate_recall)}</td>
                          <td>{formatPct(job.metrics?.iforest_gate_f1)}</td>
                          <td>{formatCount(job.metrics?.samples)}</td>
                          <td>{job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}</td>
                          <td className="job-details-cell">{renderJobDetails(job)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Model Versions</h2>
              {versions.length === 0 ? (
                <p className="muted">No persisted model versions are available yet. Rollback becomes available after at least one stored retrain version exists.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="alerts-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Active</th>
                        <th>Trained At</th>
                        <th>RF Macro Recall</th>
                        <th>RF Macro F1</th>
                        <th>IF Binary Recall</th>
                        <th>IF Binary F1</th>
                        <th>IF Gate Recall</th>
                        <th>IF Gate F1</th>
                        <th>Samples</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.map((version) => (
                        <tr key={version.version}>
                          <td className="alert-id">{version.version}</td>
                          <td>{version.active ? 'Yes' : 'No'}</td>
                          <td>{version.trained_at ? new Date(version.trained_at).toLocaleString() : 'N/A'}</td>
                          <td>{formatPct(version.metrics?.rf_macro_recall)}</td>
                          <td>{formatPct(version.metrics?.rf_macro_f1)}</td>
                          <td>{formatPct(version.metrics?.iforest_binary_recall)}</td>
                          <td>{formatPct(version.metrics?.iforest_binary_f1)}</td>
                          <td>{formatPct(version.metrics?.iforest_gate_recall)}</td>
                          <td>{formatPct(version.metrics?.iforest_gate_f1)}</td>
                          <td>{formatCount(version.metrics?.samples)}</td>
                          <td>
                            {!version.active && (
                              <button className="details-btn" onClick={() => handleRollback(version.version)}>
                                Rollback
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>False-Positive Suppressions</h2>
              {suppressions.length === 0 ? (
                <p className="muted">No suppressions created yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="alerts-table">
                    <thead>
                      <tr>
                        <th>Fingerprint</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Created By</th>
                        <th>Updated</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppressions.map((item) => (
                        <tr key={item.fingerprint}>
                          <td className="alert-id">{item.fingerprint}</td>
                          <td>{item.active ? 'Active' : 'Inactive'}</td>
                          <td>{item.reason || 'false_positive'}</td>
                          <td>{item.created_by || 'N/A'}</td>
                          <td>{item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}</td>
                          <td>
                            <button
                              className="details-btn"
                              onClick={() => handleSuppressionAction(item.fingerprint, item.active)}
                            >
                              {item.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ModelOpsPage;
