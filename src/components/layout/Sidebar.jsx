import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faListUl,
  faShieldAlt,
  faCog,
  faBrain
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: faHome, label: 'Dashboard' },
    { path: '/logs', icon: faListUl, label: 'Logs' },
    { path: '/model-ops', icon: faBrain, label: 'Model Ops' },
    { path: '/precautions', icon: faShieldAlt, label: 'Precautions & Measures' },
    { path: '/settings', icon: faCog, label: 'Settings' }
  ];

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;


