import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AlertsTable from '../components/dashboard/AlertsTable';
import { mockAlerts } from '../data/mockData';
import './Page.css';

const AlertsPage = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <h1>Alerts</h1>
        <AlertsTable alerts={mockAlerts} />
      </main>
    </div>
  );
};

export default AlertsPage;


