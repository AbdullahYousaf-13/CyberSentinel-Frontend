import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Page.css';

const ArchitecturePage = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <h1>Architecture</h1>
        <p>System architecture and infrastructure diagrams will be displayed here.</p>
      </main>
    </div>
  );
};

export default ArchitecturePage;


