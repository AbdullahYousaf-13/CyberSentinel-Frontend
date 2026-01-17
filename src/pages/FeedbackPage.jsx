import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Page.css';

const FeedbackPage = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        <h1>Human Feedback</h1>
        <p>User feedback and reports will be displayed here.</p>
      </main>
    </div>
  );
};

export default FeedbackPage;



