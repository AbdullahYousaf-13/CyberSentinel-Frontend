import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertCards from '../components/dashboard/AlertCards';
import AlertsTable from '../components/dashboard/AlertsTable';
import AttackChart from '../components/dashboard/AttackChart';
import ThreatPie from '../components/dashboard/ThreatPie';
import AlertDetailsPanel from '../components/dashboard/AlertDetailsPanel';
import { mockAlerts, alertStats, attackTrendsData, attackTypeDistribution } from '../data/mockData';
import './Dashboard.css';

const Dashboard = () => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCategory, setDetailsCategory] = useState('total');

  const handleOpenDetails = (category) => {
    setDetailsCategory(category);
    setDetailsOpen(true);
  };

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <AlertCards stats={alertStats} onDetails={handleOpenDetails} />
        <AlertsTable alerts={mockAlerts} />
        <div className="charts-container">
          <AttackChart data={attackTrendsData} />
          <ThreatPie data={attackTypeDistribution} />
        </div>
      </main>
      <AlertDetailsPanel
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        category={detailsCategory}
        stats={alertStats}
        alerts={mockAlerts}
      />
    </div>
  );
};

export default Dashboard;


