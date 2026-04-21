import React, { useState } from 'react';
import AlertDetailsPanel from './AlertDetailsPanel';
import './AlertsTable.css';

const severityClassByValue = {
  high: 'badge-high',
  critical: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low'
};

const AlertsTable = ({ alerts, showSeverity = false }) => {
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
                <th>Alert ID</th>
                <th>Detected At</th>
                <th>Alert Type</th>
                <th>Classification</th>
                {showSeverity && <th>Severity</th>}
                <th>AI Score</th>
                <th>Model Version</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="alert-id">{alert.id}</td>
                  <td>{alert.detectedAt}</td>
                  <td>{alert.alertType}</td>
                  <td>{alert.classification}</td>
                  {showSeverity && (
                    <td>
                      <span className={`severity-badge ${severityClassByValue[alert.severity] || 'badge-low'}`}>
                        {String(alert.severity || 'low').toUpperCase()}
                      </span>
                    </td>
                  )}
                  <td>{alert.aiScore}</td>
                  <td>{alert.modelVersion}</td>
                  <td>
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
        />
      )}
    </>
  );
};

export default AlertsTable;


