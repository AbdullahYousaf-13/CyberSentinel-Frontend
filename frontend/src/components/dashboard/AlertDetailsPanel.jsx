import React from 'react';
import './AlertDetailsPanel.css';

const AlertDetailsPanel = ({ isOpen, onClose, category, stats, alerts }) => {
  if (!isOpen) return null;

  const filtered =
    category === 'total'
      ? alerts
      : alerts.filter((a) => a.severity.toLowerCase() === category);

  const topSources = Object.entries(
    filtered.reduce((acc, a) => {
      acc[a.sourceIP] = (acc[a.sourceIP] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="alert-details-overlay" onClick={onClose}>
      <div className="alert-details-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Details — {category.toUpperCase()}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="panel-content">
          <div className="panel-grid">
            <div className="panel-card">
              <h4>Total in category</h4>
              <div className="metric">{filtered.length}</div>
            </div>
            <div className="panel-card">
              <h4>Overall stats</h4>
              <ul className="stats-list">
                <li>High: {stats.high}</li>
                <li>Medium: {stats.medium}</li>
                <li>Low: {stats.low}</li>
                <li>Total: {stats.total}</li>
              </ul>
            </div>
          </div>
          <div className="panel-section">
            <h4>Top Source IPs</h4>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Source IP</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {topSources.map(([ip, count]) => (
                  <tr key={ip}>
                    <td>{ip}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-section">
            <h4>Latest Alerts</h4>
            <ul className="alerts-list">
              {filtered.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <span className="id">{a.id}</span>
                  <span className="type">{a.attackType}</span>
                  <span className={`sev sev-${a.severity.toLowerCase()}`}>{a.severity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailsPanel;


