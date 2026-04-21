import React from 'react';
import './AlertDetailsPanel.css';

const AlertDetailsPanel = ({ isOpen, onClose, alert }) => {
  if (!isOpen || !alert) return null;

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
            <div className="alert-detail-row">
              <span className="alert-detail-value">{alert.rawContext?.message || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailsPanel;

