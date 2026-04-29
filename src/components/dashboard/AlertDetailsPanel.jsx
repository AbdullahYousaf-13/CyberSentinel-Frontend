import React from 'react';
import './AlertDetailsPanel.css';

const parseWebAccessLogMessage = (message) => {
  const text = String(message || '').trim();
  if (!text) return null;

  const pattern = /^(?<srcip>\S+)\s+-\s+-\s+\[(?<ts>[^\]]+)\]\s+"(?<method>[A-Z]+)\s+(?<path>\S+)\s+(?<httpver>HTTP\/[0-9.]+)"\s+(?<status>\d{3})\s+(?<bytes>\S+)\s+"(?<referrer>[^"]*)"\s+"(?<ua>[^"]*)"/;
  const match = text.match(pattern);
  if (!match || !match.groups) return null;

  const { srcip, ts, method, path, httpver, status, bytes, referrer, ua } = match.groups;
  return {
    summary: `${method} ${path} returned HTTP ${status}`,
    fields: [
      { label: 'Source IP', value: srcip },
      { label: 'Request Time', value: ts },
      { label: 'Method', value: method },
      { label: 'Path', value: path },
      { label: 'Protocol', value: httpver },
      { label: 'Status Code', value: status },
      { label: 'Response Size', value: bytes === '-' ? 'N/A' : `${bytes} bytes` },
      { label: 'Referrer', value: referrer === '-' ? 'N/A' : referrer },
      { label: 'User Agent', value: ua || 'N/A' }
    ]
  };
};

const AlertDetailsPanel = ({ isOpen, onClose, alert, onMarkKnown = null, onMarkFalsePositive = null }) => {
  if (!isOpen || !alert) return null;
  const isAnomaly = String(alert.alertType || '').toLowerCase() === 'anomaly';
  const rawMessage = alert.rawContext?.message || 'N/A';
  const parsedMessage = parseWebAccessLogMessage(rawMessage);

  return (
    <div className="alert-details-overlay" onClick={onClose}>
      <div className="alert-details-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Alert Details</h3>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>
        <div className="panel-content">
          <div className="alert-detail-section">
            <h4>AI Detection Context</h4>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Alert ID:</span>
              <span className="alert-detail-value">{alert.id}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Detected At:</span>
              <span className="alert-detail-value">{alert.detectedAt}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Alert Type:</span>
              <span className="alert-detail-value">{alert.alertType}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Classification:</span>
              <span className="alert-detail-value">{alert.classification}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">AI Score:</span>
              <span className="alert-detail-value">{alert.aiScore}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Model Version:</span>
              <span className="alert-detail-value">{alert.modelVersion}</span>
            </div>
          </div>
          <div className="alert-detail-section">
            <h4>Raw Event Telemetry</h4>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Event ID:</span>
              <span className="alert-detail-value">{alert.rawContext?.eventId || 'N/A'}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Event Time:</span>
              <span className="alert-detail-value">{alert.rawContext?.eventTime || 'N/A'}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Agent:</span>
              <span className="alert-detail-value">{alert.rawContext?.agentName || 'N/A'}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Event Origin:</span>
              <span className="alert-detail-value">{alert.rawContext?.eventOrigin || 'N/A'}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Decoder:</span>
              <span className="alert-detail-value">{alert.rawContext?.decoderName || 'N/A'}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Network:</span>
              <span className="alert-detail-value">{alert.rawContext?.network || 'N/A'}</span>
            </div>
          </div>
          <div className="alert-detail-section">
            <h4>Message</h4>
            {parsedMessage ? (
              <>
                <div className="alert-message-summary">{parsedMessage.summary}</div>
                <div className="alert-message-grid">
                  {parsedMessage.fields.map((item) => (
                    <div key={item.label} className="alert-message-item">
                      <span className="alert-message-item-label">{item.label}</span>
                      <span className="alert-message-item-value">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="alert-detail-row">
                  <span className="alert-detail-label">Raw Message:</span>
                  <span className="alert-detail-value alert-message-raw">{rawMessage}</span>
                </div>
              </>
            ) : (
              <div className="alert-detail-row">
                <span className="alert-detail-value alert-message-raw">{rawMessage}</span>
              </div>
            )}
          </div>
          {isAnomaly && (
            <div className="alert-details-actions">
              {onMarkKnown && (
                <button className="details-btn" onClick={() => onMarkKnown(alert)}>
                  Mark as Known Attack
                </button>
              )}
              {onMarkFalsePositive && (
                <button className="details-btn" onClick={() => onMarkFalsePositive(alert)}>
                  Mark as False Positive
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDetailsPanel;

