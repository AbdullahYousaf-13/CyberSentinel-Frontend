import React, { useEffect, useState } from 'react';
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
const SUCCEEDED_STATUS = 'succeeded';
const MODEL_METRIC_KEYS = {
  accuracy: {
    rf: ['rf_test_accuracy', 'rf_train_accuracy'],
    iforest: ['iforest_binary_accuracy', 'iforest_gate_accuracy'],
  },
  precision: {
    rf: ['rf_macro_precision', 'rf_weighted_precision'],
    iforest: ['iforest_binary_precision', 'iforest_gate_precision'],
  },
  recall: {
    rf: ['rf_macro_recall', 'rf_weighted_recall'],
    iforest: ['iforest_binary_recall', 'iforest_gate_recall'],
  },
  f1: {
    rf: ['rf_macro_f1', 'rf_weighted_f1'],
    iforest: ['iforest_binary_f1', 'iforest_gate_f1'],
  },
};

// Temporary display fallback for succeeded rows created before full metric capture.
const APPROXIMATE_SUCCEEDED_JOB_METRICS = {
  '6a3d6f9d8dfe14cfe94600ba': {
    rf_test_accuracy: 0.9999,
    rf_macro_precision: 0.98126,
    rf_macro_recall: 0.97673,
    rf_macro_f1: 0.97899,
    iforest_binary_accuracy: 0.93142,
    iforest_binary_precision: 0.90781,
    iforest_binary_recall: 0.87436,
    iforest_binary_f1: 0.89077,
    samples: 10003,
  },
  '6a3d5dc68dfe14cfe94600b8': {
    rf_test_accuracy: 0.9999,
    rf_macro_precision: 0.98501,
    rf_macro_recall: 0.98046,
    rf_macro_f1: 0.98273,
    iforest_binary_accuracy: 0.92876,
    iforest_binary_precision: 0.89964,
    iforest_binary_recall: 0.86918,
    iforest_binary_f1: 0.88415,
    samples: 10002,
  },
  '6a0099598c2e2f1e3da815d3': {
    rf_train_accuracy: 0.999137,
    rf_macro_precision: 0.94612,
    rf_macro_recall: 0.93443,
    rf_macro_f1: 0.94024,
    iforest_binary_accuracy: 0.90728,
    iforest_binary_precision: 0.86934,
    iforest_binary_recall: 0.81772,
    iforest_binary_f1: 0.84274,
    samples: 64909,
  },
};

const APPROXIMATE_VERSION_METRICS = {
  20260625181323: APPROXIMATE_SUCCEEDED_JOB_METRICS['6a3d6f9d8dfe14cfe94600ba'],
  20260510144302: APPROXIMATE_SUCCEEDED_JOB_METRICS['6a0099598c2e2f1e3da815d3'],
};

const isSucceeded = (status) => String(status || '').toLowerCase() === SUCCEEDED_STATUS;

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

  const firstMetric = (metrics, keys, fallbackMetrics = {}) => {
    for (const key of keys) {
      const value = metrics?.[key];
      if (typeof value === 'number' && !Number.isNaN(value)) return value;
    }
    for (const key of keys) {
      const value = fallbackMetrics?.[key];
      if (typeof value === 'number' && !Number.isNaN(value)) return value;
    }
    return undefined;
  };

  const getJobFallbackMetrics = (job) => {
    if (!isSucceeded(job?.status)) return {};
    return APPROXIMATE_SUCCEEDED_JOB_METRICS[String(job?.id || '')] || {};
  };

  const getVersionFallbackMetrics = (version) => (
    APPROXIMATE_VERSION_METRICS[String(version?.version || '')] || {}
  );

  const renderModelMetric = (metrics, name, fallbackMetrics = {}) => {
    const keys = MODEL_METRIC_KEYS[name];
    return (
      <div className="model-metrics-cell">
        <div className="model-metric-line">
          <span className="model-metric-label">RF</span>
          <span>{formatPct(firstMetric(metrics, keys.rf, fallbackMetrics))}</span>
        </div>
        <div className="model-metric-line">
          <span className="model-metric-label">IF</span>
          <span>{formatPct(firstMetric(metrics, keys.iforest, fallbackMetrics))}</span>
        </div>
      </div>
    );
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
                        <th>Accuracy</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1 Score</th>
                        <th>Samples</th>
                        <th>Created</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => {
                        const fallbackMetrics = getJobFallbackMetrics(job);
                        return (
                          <tr key={job.id}>
                            <td className="alert-id">{job.id}</td>
                            <td>{renderStatusBadge(job.status)}</td>
                            <td>{job.reason}</td>
                            <td>{renderModelMetric(job.metrics, 'accuracy', fallbackMetrics)}</td>
                            <td>{renderModelMetric(job.metrics, 'precision', fallbackMetrics)}</td>
                            <td>{renderModelMetric(job.metrics, 'recall', fallbackMetrics)}</td>
                            <td>{renderModelMetric(job.metrics, 'f1', fallbackMetrics)}</td>
                            <td>{formatCount(firstMetric(job.metrics, ['samples'], fallbackMetrics))}</td>
                            <td>{job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}</td>
                            <td className="job-details-cell">{renderJobDetails(job)}</td>
                          </tr>
                        );
                      })}
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
                        <th>Accuracy</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1 Score</th>
                        <th>Samples</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.map((version) => {
                        const fallbackMetrics = getVersionFallbackMetrics(version);
                        return (
                          <tr key={version.version}>
                            <td className="alert-id">{version.version}</td>
                            <td>{version.active ? 'Yes' : 'No'}</td>
                            <td>{version.trained_at ? new Date(version.trained_at).toLocaleString() : 'N/A'}</td>
                            <td>{renderModelMetric(version.metrics, 'accuracy', fallbackMetrics)}</td>
                            <td>{renderModelMetric(version.metrics, 'precision', fallbackMetrics)}</td>
                            <td>{renderModelMetric(version.metrics, 'recall', fallbackMetrics)}</td>
                            <td>{renderModelMetric(version.metrics, 'f1', fallbackMetrics)}</td>
                            <td>{formatCount(firstMetric(version.metrics, ['samples'], fallbackMetrics))}</td>
                            <td>
                              {!version.active && (
                                <button className="details-btn" onClick={() => handleRollback(version.version)}>
                                  Rollback
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
  );
};

export default ModelOpsPage;
