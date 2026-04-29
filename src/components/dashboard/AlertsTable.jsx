import React, { useState } from 'react';
import AlertDetailsPanel from './AlertDetailsPanel';
import './AlertsTable.css';

const severityClassByValue = {
  high: 'badge-high',
  critical: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low'
};

const AlertsTable = ({
  alerts,
  showSeverity = false,
  isAdmin = false,
  onConfirmKnown = null,
  onMarkFalsePositive = null
}) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleDetailsClick = (alert) => {
    setSelectedAlert(alert);
    setShowDetails(true);
  };

  return (
    <>
      <div className="alerts-table-container">
        <h2 className="section-title">Recent Threat Alerts</h2>
        <div className="table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th className="col-alert-id">Alert ID</th>
                <th className="col-detected-at">Detected At</th>
                <th className="col-alert-type">Alert Type</th>
                <th className="col-classification">Classification</th>
                {showSeverity && <th className="col-severity">Severity</th>}
                <th className="col-ai-score">AI Score</th>
                <th className="col-model-version">Model Version</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="alert-id col-alert-id">{alert.id}</td>
                  <td className="col-detected-at">{alert.detectedAt}</td>
                  <td className="col-alert-type">{alert.alertType}</td>
                  <td className="col-classification">{alert.classification}</td>
                  {showSeverity && (
                    <td className="col-severity">
                      <span className={`severity-badge ${severityClassByValue[alert.severity] || 'badge-low'}`}>
                        {String(alert.severity || 'low').toUpperCase()}
                      </span>
                    </td>
                  )}
                  <td className="col-ai-score">{alert.aiScore}</td>
                  <td className="col-model-version">{alert.modelVersion}</td>
                  <td className="col-action">
                    <button className="details-btn" onClick={() => handleDetailsClick(alert)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showDetails && selectedAlert && (
        <AlertDetailsPanel
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          alert={selectedAlert}
          isAdmin={isAdmin}
          onMarkKnown={onConfirmKnown}
          onMarkFalsePositive={onMarkFalsePositive}
        />
      )}
    </>
  );
};

export default AlertsTable;


