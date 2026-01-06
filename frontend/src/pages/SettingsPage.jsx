import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Page.css';

const SettingsPage = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <h1>Settings</h1>
        <p>Application settings and configuration will be displayed here.</p>
      </main>
    </div>
  );
};

export default SettingsPage;


