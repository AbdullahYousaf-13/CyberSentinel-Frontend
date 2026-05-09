import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import {
  createBackfillJob,
  activateSuppression,
  createRetrainJob,
  deactivateSuppression,
  importBootstrapReviews,
  listBackfillJobs,
  listSuppressions,
  listModelVersions,
  listRetrainJobs,
  previewBootstrapDataset,
  rollbackModelVersion
} from '../services/api';
import './Page.css';
import './Settings.css';

const DATASET_MODE_LABELS = {
  feedback_only: 'Feedback Only',
  bootstrap_seed: 'Bootstrap Seed Only',
  bootstrap_plus_feedback: 'Bootstrap + Feedback'
};

const createInlineDraftFromRow = (row) => ({
  staged: false,
  review_verdict: row.review_verdict || (row.heuristic_classification ? 'confirmed_known_attack' : 'confirmed_benign'),
  review_classification: row.review_classification || row.heuristic_classification || '',
  notes: row.heuristic_reason || ''
});

const buildInlineDraftMap = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.log_id] = createInlineDraftFromRow(row);
    return acc;
  }, {});

const ModelOpsPage = () => {
  const [reason, setReason] = useState('');
  const [modelFamily, setModelFamily] = useState('web_access');
  const [datasetMode, setDatasetMode] = useState('bootstrap_plus_feedback');
  const [scanLimit, setScanLimit] = useState(5000);
  const [previewLimit, setPreviewLimit] = useState(100);
  const [jobs, setJobs] = useState([]);
  const [backfillJobs, setBackfillJobs] = useState([]);
  const [versions, setVersions] = useState([]);
  const [suppressions, setSuppressions] = useState([]);
  const [bootstrapPreview, setBootstrapPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [savingInlineReviews, setSavingInlineReviews] = useState(false);
  const [inlineReviews, setInlineReviews] = useState({});
  const fileInputRef = useRef(null);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [backfillRows, jobRows, versionResp, suppressionRows] = await Promise.all([
        listBackfillJobs({ limit: 20 }),
        listRetrainJobs({ limit: 20 }),
        listModelVersions(),
        listSuppressions({ limit: 200 })
      ]);
      setBackfillJobs(backfillRows || []);
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

  useEffect(() => {
    setBootstrapPreview(null);
    setInlineReviews({});
  }, [modelFamily]);

  const handleStartRetrain = async () => {
    try {
      setError('');
      const payload = {
        reason: reason.trim() || 'Manual retraining',
        model_family: modelFamily,
        dataset_mode: datasetMode
      };
      const created = await createRetrainJob(payload);
      setMessage(`Retrain job queued: ${created.id}`);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to queue retrain job.');
    }
  };

  const handleStartBackfill = async () => {
    try {
      setError('');
      const payload = {
        reason: reason.trim() || `Historical backfill for ${modelFamily}`,
        model_family: modelFamily,
        scan_limit: Number(scanLimit) || 5000
      };
      const created = await createBackfillJob(payload);
      setMessage(`Backfill job queued: ${created.id}`);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to queue backfill job.');
    }
  };

  const handlePreviewBootstrap = async () => {
    try {
      setPreviewLoading(true);
      setError('');
      const preview = await previewBootstrapDataset({
        model_family: modelFamily,
        scan_limit: Number(scanLimit) || 5000,
        preview_limit: Number(previewLimit) || 100,
        include_feedback_overrides: true,
        min_class_support: 10
      });
      setBootstrapPreview(preview);
      setInlineReviews(buildInlineDraftMap(preview.rows || []));
      setMessage(`Bootstrap preview refreshed for ${modelFamily}.`);
    } catch (err) {
      setError(err.message || 'Failed to build bootstrap preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPreview = async () => {
    try {
      setError('');
      const preview = await previewBootstrapDataset({
        model_family: modelFamily,
        scan_limit: Number(scanLimit) || 5000,
        preview_limit: Number(scanLimit) || 5000,
        include_feedback_overrides: true,
        min_class_support: 10
      });
      const blob = new Blob([JSON.stringify(preview.rows || [], null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${modelFamily}_bootstrap_review.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      setMessage(`Downloaded ${preview.rows?.length || 0} review rows for ${modelFamily}.`);
    } catch (err) {
      setError(err.message || 'Failed to download bootstrap review rows.');
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      setError('');
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items)) {
        throw new Error('Review file must contain a JSON array or an object with an items array.');
      }
      const result = await importBootstrapReviews({
        model_family: modelFamily,
        items: items.map((item) => ({
          log_id: item.log_id,
          review_verdict: item.review_verdict,
          review_classification: item.review_classification || undefined,
          notes: item.notes || undefined
        }))
      });
      setMessage(`Imported reviews: applied=${result.applied}, skipped=${result.skipped}, failed=${result.failed}`);
      await handlePreviewBootstrap();
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to import review file.');
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

  const formatGate = (gate) => {
    if (!gate || typeof gate !== 'object') return 'N/A';
    if (gate.passed === true) return 'Passed';
    if (gate.passed === false) return 'Blocked';
    return 'N/A';
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

  const formatDistribution = (distribution) => {
    if (!distribution || typeof distribution !== 'object') return 'N/A';
    const entries = Object.entries(distribution);
    if (entries.length === 0) return 'N/A';
    return entries.map(([label, count]) => `${label}: ${count}`).join(', ');
  };

  const formatDecimal = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return value.toFixed(4);
  };

  const formatWholeNumber = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return value.toLocaleString();
  };

  const getInlineDraft = (row) => inlineReviews[row.log_id] || createInlineDraftFromRow(row);

  const setRowDraft = (row, updater) => {
    setInlineReviews((prev) => {
      const current = prev[row.log_id] || createInlineDraftFromRow(row);
      const next = updater(current);
      return {
        ...prev,
        [row.log_id]: next
      };
    });
  };

  const handleStageToggle = (row, staged) => {
    setRowDraft(row, (current) => ({
      ...current,
      staged
    }));
  };

  const handleVerdictChange = (row, nextVerdict) => {
    setRowDraft(row, (current) => ({
      ...current,
      staged: true,
      review_verdict: nextVerdict,
      review_classification: nextVerdict === 'confirmed_known_attack'
        ? (current.review_classification || row.heuristic_classification || '')
        : ''
    }));
  };

  const handleClassificationChange = (row, nextClassification) => {
    setRowDraft(row, (current) => ({
      ...current,
      staged: true,
      review_classification: nextClassification
    }));
  };

  const handleNotesChange = (row, nextNotes) => {
    setRowDraft(row, (current) => ({
      ...current,
      staged: true,
      notes: nextNotes
    }));
  };

  const handleResetRow = (row) => {
    setInlineReviews((prev) => ({
      ...prev,
      [row.log_id]: createInlineDraftFromRow(row)
    }));
  };

  const handleStageAllVisible = () => {
    if (!bootstrapPreview?.rows?.length) return;
    setInlineReviews((prev) => {
      const next = { ...prev };
      bootstrapPreview.rows.forEach((row) => {
        next[row.log_id] = {
          ...(prev[row.log_id] || createInlineDraftFromRow(row)),
          staged: true
        };
      });
      return next;
    });
  };

  const handleResetVisible = () => {
    setInlineReviews(buildInlineDraftMap(bootstrapPreview?.rows || []));
  };

  const handleApplyInlineReviews = async () => {
    const rows = bootstrapPreview?.rows || [];
    const stagedRows = rows
      .map((row) => ({ row, draft: getInlineDraft(row) }))
      .filter(({ draft }) => draft.staged);

    if (stagedRows.length === 0) {
      setError('Stage at least one preview row before applying inline reviews.');
      return;
    }

    const invalidAttackRow = stagedRows.find(
      ({ draft }) => draft.review_verdict === 'confirmed_known_attack' && !String(draft.review_classification || '').trim()
    );
    if (invalidAttackRow) {
      setError(`Attack classification is required for staged row ${invalidAttackRow.row.log_id}.`);
      return;
    }

    try {
      setSavingInlineReviews(true);
      setError('');
      const result = await importBootstrapReviews({
        model_family: modelFamily,
        items: stagedRows.map(({ row, draft }) => ({
          log_id: row.log_id,
          review_verdict: draft.review_verdict,
          review_classification: draft.review_verdict === 'confirmed_known_attack'
            ? String(draft.review_classification || '').trim()
            : undefined,
          notes: String(draft.notes || '').trim() || undefined
        }))
      });
      setMessage(`Inline reviews applied: applied=${result.applied}, skipped=${result.skipped}, failed=${result.failed}`);
      await handlePreviewBootstrap();
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to apply inline reviews.');
    } finally {
      setSavingInlineReviews(false);
    }
  };

  const stagedCount = (bootstrapPreview?.rows || []).filter((row) => getInlineDraft(row).staged).length;

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <div className="settings-grid">
          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Model Retraining</h2>
              <p className="muted">Retrain directly from the frontend using feedback-only or bootstrap Wazuh datasets. `web_access` trains a calibrated RandomForest family model. Other families stay rules-only until they have enough reviewed benign and attack labels.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="model-ops-reason-input"
                placeholder="Message.."
                rows={3}
              />
              <select
                value={modelFamily}
                onChange={(e) => setModelFamily(e.target.value)}
                className="model-ops-reason-input"
                style={{ marginTop: '12px' }}
              >
                <option value="web_access">web_access</option>
                <option value="auth">auth</option>
                <option value="host_telemetry">host_telemetry</option>
                <option value="integrity_compliance">integrity_compliance</option>
              </select>
              <select
                value={datasetMode}
                onChange={(e) => setDatasetMode(e.target.value)}
                className="model-ops-reason-input"
                style={{ marginTop: '12px' }}
              >
                <option value="feedback_only">feedback_only</option>
                <option value="bootstrap_plus_feedback">bootstrap_plus_feedback</option>
                <option value="bootstrap_seed">bootstrap_seed</option>
              </select>
              <div className="settings-actions" style={{ marginTop: '12px' }}>
                <button className="details-btn" onClick={handleStartRetrain}>Start Retrain</button>
                <button className="details-btn" onClick={handleStartBackfill} style={{ marginLeft: '8px' }}>
                  Run Historical Backfill
                </button>
                <button className="details-btn" onClick={refresh} style={{ marginLeft: '8px' }}>Refresh</button>
              </div>
              {loading && <p className="muted">Loading model ops data...</p>}
              {message && <p className="form-info">{message}</p>}
              {error && <p className="form-error">{error}</p>}
            </div>
          </section>

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Bootstrap Review Flow</h2>
              <p className="muted">Preview heuristic labels, review them inline, and push analyst-confirmed feedback directly from this table.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  value={scanLimit}
                  onChange={(e) => setScanLimit(e.target.value)}
                  className="model-ops-reason-input"
                  style={{ maxWidth: '180px' }}
                  min="1"
                  max="20000"
                  placeholder="Scan limit"
                />
                <input
                  type="number"
                  value={previewLimit}
                  onChange={(e) => setPreviewLimit(e.target.value)}
                  className="model-ops-reason-input"
                  style={{ maxWidth: '180px' }}
                  min="0"
                  max="1000"
                  placeholder="Preview rows"
                />
              </div>
              <div className="settings-actions" style={{ marginTop: '12px' }}>
                <button className="details-btn" onClick={handlePreviewBootstrap}>Preview Bootstrap Labels</button>
                <button className="details-btn" onClick={handleDownloadPreview} style={{ marginLeft: '8px' }}>
                  Download Review JSON
                </button>
                <button className="details-btn" onClick={handleImportClick} style={{ marginLeft: '8px' }}>
                  Import Reviewed JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />
              </div>
              {previewLoading && <p className="muted">Building bootstrap preview...</p>}
              {bootstrapPreview && (
                <>
                  <div className="model-ops-inline-meta">
                    <p className="muted">Feature schema: {bootstrapPreview.feature_schema_version}</p>
                    <p className="muted">Scanned logs: {bootstrapPreview.scanned_logs}</p>
                    <p className="muted">Usable samples: {bootstrapPreview.usable_samples}</p>
                    <p className="muted">Feedback overrides: {bootstrapPreview.feedback_override_count}</p>
                    <p className="muted">Final label distribution: {formatDistribution(bootstrapPreview.label_distribution)}</p>
                    <p className="muted">Raw label distribution: {formatDistribution(bootstrapPreview.raw_label_distribution)}</p>
                    <p className="muted">Review verdict distribution: {formatDistribution(bootstrapPreview.verdict_distribution)}</p>
                    <p className="muted">
                      Threshold gate: {bootstrapPreview.thresholds.passed ? 'Passed' : 'Blocked'} | benign {bootstrapPreview.thresholds.benign_available}/{bootstrapPreview.thresholds.benign_required} | attack {bootstrapPreview.thresholds.attack_available}/{bootstrapPreview.thresholds.attack_required}
                    </p>
                  </div>
                  <p className="muted model-ops-inline-note">
                    Use `false_positive` to create future suppression. Use `confirmed_benign` only as training feedback.
                  </p>
                  <div className="model-ops-inline-actions">
                    <button className="details-btn" onClick={handleStageAllVisible}>
                      Stage All Visible
                    </button>
                    <button className="details-btn" onClick={handleResetVisible}>
                      Reset Visible
                    </button>
                    <button className="details-btn" onClick={handleApplyInlineReviews} disabled={savingInlineReviews}>
                      {savingInlineReviews ? 'Applying...' : `Apply Staged Reviews (${stagedCount})`}
                    </button>
                  </div>
                  <div className="table-wrapper" style={{ marginTop: '12px' }}>
                    <table className="alerts-table">
                      <thead>
                        <tr>
                          <th>Stage</th>
                          <th>Timestamp</th>
                          <th>Decoder</th>
                          <th>Heuristic</th>
                          <th>Verdict</th>
                          <th>Classification</th>
                          <th>Notes</th>
                          <th>Source</th>
                          <th>Message</th>
                          <th>Reset</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bootstrapPreview.rows.map((row) => {
                          const draft = getInlineDraft(row);
                          return (
                          <tr
                            key={`${row.log_id}-${row.timestamp}`}
                            className={draft.staged ? 'model-ops-inline-row is-staged' : 'model-ops-inline-row'}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="model-ops-inline-checkbox"
                                checked={draft.staged}
                                onChange={(e) => handleStageToggle(row, e.target.checked)}
                              />
                            </td>
                            <td>{row.timestamp || 'N/A'}</td>
                            <td>{row.decoder_name || 'N/A'}</td>
                            <td>{row.heuristic_classification || row.heuristic_verdict}</td>
                            <td className="model-ops-inline-cell">
                              <select
                                value={draft.review_verdict}
                                className="model-ops-inline-input model-ops-inline-select"
                                onChange={(e) => handleVerdictChange(row, e.target.value)}
                              >
                                <option value="confirmed_benign">confirmed_benign</option>
                                <option value="false_positive">false_positive</option>
                                <option value="confirmed_known_attack">confirmed_known_attack</option>
                                <option value="skip">skip</option>
                              </select>
                            </td>
                            <td className="model-ops-inline-cell">
                              <input
                                type="text"
                                value={draft.review_verdict === 'confirmed_known_attack' ? draft.review_classification : ''}
                                className="model-ops-inline-input"
                                placeholder="Attack label"
                                disabled={draft.review_verdict !== 'confirmed_known_attack'}
                                onChange={(e) => handleClassificationChange(row, e.target.value)}
                              />
                            </td>
                            <td className="model-ops-inline-cell">
                              <textarea
                                value={draft.notes}
                                className="model-ops-inline-input model-ops-inline-notes"
                                placeholder="Review notes"
                                rows={2}
                                onChange={(e) => handleNotesChange(row, e.target.value)}
                              />
                            </td>
                            <td>{row.label_source}</td>
                            <td>{row.message}</td>
                            <td>
                              <button className="details-btn" onClick={() => handleResetRow(row)}>
                                Reset
                              </button>
                            </td>
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="setting-card">
            <div className="setting-card-content">
              <h2>Backfill Jobs</h2>
              {backfillJobs.length === 0 ? (
                <p className="muted">No backfill jobs yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="alerts-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Family</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Scan Limit</th>
                        <th>Processed</th>
                        <th>Updated Logs</th>
                        <th>Open Alerts</th>
                        <th>Reclassified Benign</th>
                        <th>Created Alerts</th>
                        <th>Failures</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backfillJobs.map((job) => (
                        <tr key={job.id}>
                          <td className="alert-id">{job.id}</td>
                          <td>{job.model_family || 'N/A'}</td>
                          <td>{job.status}</td>
                          <td>{job.reason}</td>
                          <td>{formatWholeNumber(job.scan_limit)}</td>
                          <td>{formatWholeNumber(job.result?.processed_logs)}</td>
                          <td>{formatWholeNumber(job.result?.updated_logs)}</td>
                          <td>{formatWholeNumber(job.result?.refreshed_alerts)}</td>
                          <td>{formatWholeNumber(job.result?.suppressed_alerts)}</td>
                          <td>{formatWholeNumber(job.result?.created_alerts)}</td>
                          <td>{formatWholeNumber(job.result?.failed)}</td>
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
              <h2>Retrain Jobs</h2>
              {jobs.length === 0 ? (
                <p className="muted">No retrain jobs yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="alerts-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Family</th>
                        <th>Dataset</th>
                        <th>Strategy</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Duration</th>
                        <th>Train Acc</th>
                        <th>Val Precision</th>
                        <th>Val FPR</th>
                        <th>Val Recall</th>
                        <th>Val Threshold</th>
                        <th>Test Precision</th>
                        <th>Test FPR</th>
                        <th>Test Recall</th>
                        <th>Samples</th>
                        <th>Labels</th>
                        <th>Gate</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="alert-id">{job.id}</td>
                          <td>{job.model_family || 'N/A'}</td>
                          <td>{DATASET_MODE_LABELS[job.dataset_mode] || job.dataset_mode || 'N/A'}</td>
                          <td>{job.result?.training_strategy || 'N/A'}</td>
                          <td>{job.status}</td>
                          <td>{job.reason}</td>
                          <td>{formatDuration(job.started_at, job.finished_at)}</td>
                          <td>{formatPct(job.metrics?.train_accuracy)}</td>
                          <td>{formatPct(job.metrics?.validation?.binary_precision)}</td>
                          <td>{formatPct(job.metrics?.validation?.benign_false_positive_rate)}</td>
                          <td>{formatPct(job.metrics?.validation?.attack_recall)}</td>
                          <td>{formatDecimal(job.metrics?.validation?.decision_threshold)}</td>
                          <td>{formatPct(job.metrics?.test?.binary_precision)}</td>
                          <td>{formatPct(job.metrics?.test?.benign_false_positive_rate)}</td>
                          <td>{formatPct(job.metrics?.test?.attack_recall)}</td>
                          <td>{typeof job.metrics?.samples === 'number' ? job.metrics.samples : 'N/A'}</td>
                          <td>{formatDistribution(job.metrics?.label_distribution)}</td>
                          <td>{formatGate(job.result?.activation_gate)}</td>
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
                        <th>Family</th>
                        <th>Schema</th>
                        <th>Active</th>
                        <th>Strategy</th>
                        <th>Trained At</th>
                        <th>Train Acc</th>
                        <th>Val Precision</th>
                        <th>Val FPR</th>
                        <th>Val Recall</th>
                        <th>Val Threshold</th>
                        <th>Test Precision</th>
                        <th>Test FPR</th>
                        <th>Test Recall</th>
                        <th>Samples</th>
                        <th>Labels</th>
                        <th>Gate</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.map((version) => (
                        <tr key={version.version}>
                          <td className="alert-id">{version.version}</td>
                          <td>{version.model_family || 'N/A'}</td>
                          <td>{version.feature_schema_version || 'N/A'}</td>
                          <td>{version.active ? 'Yes' : 'No'}</td>
                          <td>{version.training_strategy || version.metrics?.training_strategy || 'N/A'}</td>
                          <td>{version.trained_at ? new Date(version.trained_at).toLocaleString() : 'N/A'}</td>
                          <td>{formatPct(version.metrics?.train_accuracy)}</td>
                          <td>{formatPct(version.metrics?.validation?.binary_precision)}</td>
                          <td>{formatPct(version.metrics?.validation?.benign_false_positive_rate)}</td>
                          <td>{formatPct(version.metrics?.validation?.attack_recall)}</td>
                          <td>{formatDecimal(version.metrics?.validation?.decision_threshold)}</td>
                          <td>{formatPct(version.metrics?.test?.binary_precision)}</td>
                          <td>{formatPct(version.metrics?.test?.benign_false_positive_rate)}</td>
                          <td>{formatPct(version.metrics?.test?.attack_recall)}</td>
                          <td>{typeof version.metrics?.samples === 'number' ? version.metrics.samples : 'N/A'}</td>
                          <td>{formatDistribution(version.metrics?.label_distribution)}</td>
                          <td>{formatGate(version.activation_gate)}</td>
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
