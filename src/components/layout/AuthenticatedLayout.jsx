import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import '../../pages/Page.css';

const AuthenticatedLayout = () => (
  <div className="dashboard-layout">
    <Header />
    <Sidebar />
    <Outlet />
  </div>
);

export default AuthenticatedLayout;
