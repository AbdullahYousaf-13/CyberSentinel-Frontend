import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Page.css';

const LogsPage = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <h1>Logs</h1>
        <p>System logs and activity monitoring will be displayed here.</p>
      </main>
    </div>
  );
};

export default LogsPage;


