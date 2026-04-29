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

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const ms = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${min}m ${rem}s`;
  };

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
                <button className="details-btn" onClick={handleStartRetrain}>Start Retrain</button>
                <button className="details-btn" onClick={refresh} style={{ marginLeft: '8px' }}>Refresh</button>
              </div>
              {loading && <p className="muted">Loading model ops data...</p>}
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
                        <th>RF Train Acc</th>
                        <th>IF Benign Anomaly</th>
                        <th>Samples</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="alert-id">{job.id}</td>
                          <td>{job.status}</td>
                          <td>{job.reason}</td>
                          <td>{formatDuration(job.started_at, job.finished_at)}</td>
                          <td>{formatPct(job.metrics?.rf_train_accuracy)}</td>
                          <td>{formatPct(job.metrics?.iforest_benign_anomaly_rate)}</td>
                          <td>{typeof job.metrics?.samples === 'number' ? job.metrics.samples : 'N/A'}</td>
                          <td>{job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}</td>
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
                <p className="muted">No model versions available.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="alerts-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Active</th>
                        <th>Trained At</th>
                        <th>RF Train Acc</th>
                        <th>IF Benign Anomaly</th>
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
                          <td>{formatPct(version.metrics?.rf_train_accuracy)}</td>
                          <td>{formatPct(version.metrics?.iforest_benign_anomaly_rate)}</td>
                          <td>{typeof version.metrics?.samples === 'number' ? version.metrics.samples : 'N/A'}</td>
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
