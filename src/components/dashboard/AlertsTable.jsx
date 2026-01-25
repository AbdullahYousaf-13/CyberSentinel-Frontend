import React, { useState } from 'react';
import AlertDetailsPanel from './AlertDetailsPanel';
import './AlertsTable.css';

const AlertsTable = ({ alerts, stats }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const getSeverityBadgeClass = (severity) => {
    switch (severity.toLowerCase()) {
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
                <th>Timestamp</th>
                <th>Source IP</th>
                <th>Attack Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="alert-id">{alert.id}</td>
                  <td>{alert.timestamp}</td>
                  <td>{alert.sourceIP}</td>
                  <td>{alert.attackType}</td>
                  <td>
                    <span className={`severity-badge ${getSeverityBadgeClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>{alert.status}</td>
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


