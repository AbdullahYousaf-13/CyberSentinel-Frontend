import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Page.css';

const PrecautionsPage = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <h1>Precautions & Measures</h1>
        <p>Security precautions and preventive measures will be displayed here.</p>
      </main>
    </div>
  );
};

export default PrecautionsPage;


