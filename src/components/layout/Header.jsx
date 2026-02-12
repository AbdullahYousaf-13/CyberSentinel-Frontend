import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'DASHBOARD';
    if (path === '/logs') return 'LOGS';
    if (path === '/precautions') return 'PRECAUTIONS & MEASURES';
    if (path === '/settings') return 'SETTINGS';
    return 'DASHBOARD';
  };

  // Mock notifications data
  const notifications = [
    { id: 1, message: 'New DDoS attack detected from 192.168.1.45', time: '5 mins ago', read: false },
    { id: 2, message: 'SQL Injection attempt blocked', time: '1 hour ago', read: false },
    { id: 3, message: 'Port scan detected from external IP', time: '2 hours ago', read: true },
    { id: 4, message: 'Malware signature detected in network traffic', time: '1 day ago', read: true }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Mock user data
  const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Clear any auth tokens/localStorage
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-container">
          <img
            src={`${process.env.PUBLIC_URL}/cybersentinel-logo.png`}
            alt="CyberSentinel Logo"
            className="logo-img"
          />
          <span className="logo-text">CYBERSENTINEL</span>
        </div>
        <div className="header-title-separator"></div>
        <h1 className="header-title">{getPageTitle()}</h1>
      </div>
      <div className="header-right">
        <div className="notification-wrapper" ref={notificationsRef}>
          <button 
            className="header-icon-btn" 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <span className="unread-count">{unreadCount} new</span>
              </div>
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  >
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="user-menu-wrapper" ref={userMenuRef}>
          <button 
            className="header-icon-btn" 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <FontAwesomeIcon icon={faUser} />
          </button>
          {userMenuOpen && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <span className="user-name">{userName}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
