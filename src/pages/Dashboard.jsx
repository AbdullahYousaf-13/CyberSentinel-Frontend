import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertCards from '../components/dashboard/AlertCards';
import AlertsTable from '../components/dashboard/AlertsTable';
import AttackChart from '../components/dashboard/AttackChart';
import ThreatPie from '../components/dashboard/ThreatPie';
import { mockAlerts, alertStats, attackTrendsData, attackTypeDistribution } from '../data/mockData';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <AlertCards stats={alertStats} />
        <AlertsTable alerts={mockAlerts} stats={alertStats} />
        <div className="charts-container">
          <AttackChart data={attackTrendsData} />
          <ThreatPie data={attackTypeDistribution} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


