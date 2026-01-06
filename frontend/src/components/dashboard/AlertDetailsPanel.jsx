import React from 'react';
import './AlertDetailsPanel.css';

const AlertDetailsPanel = ({ isOpen, onClose, alert }) => {
  if (!isOpen || !alert) return null;

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'badge-high';
      case 'medium':
        return 'badge-medium';
      case 'low':
        return 'badge-low';
      default:
        return 'badge-low';
    }
  };

  return (
    <div className="alert-details-overlay" onClick={onClose}>
      <div className="alert-details-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Alert Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="panel-content">
          <div className="alert-detail-section">
            <h4>Alert Information</h4>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Alert ID:</span>
              <span className="alert-detail-value">{alert.id}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Timestamp:</span>
              <span className="alert-detail-value">{alert.timestamp}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Source IP:</span>
              <span className="alert-detail-value">{alert.sourceIP}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Attack Type:</span>
              <span className="alert-detail-value">{alert.attackType}</span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Severity:</span>
              <span className="alert-detail-value">
                <span className={`severity-badge ${getSeverityBadgeClass(alert.severity)}`}>
                  {alert.severity}
                </span>
              </span>
            </div>
            <div className="alert-detail-row">
              <span className="alert-detail-label">Status:</span>
              <span className="alert-detail-value">{alert.status}</span>
            </div>
          </div>
          {alert.description && (
            <div className="alert-detail-section">
              <h4>Description</h4>
              <div className="alert-detail-row">
                <span className="alert-detail-value">{alert.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDetailsPanel;
