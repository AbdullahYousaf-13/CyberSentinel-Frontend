import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { fetchAlerts, fetchMe } from '../../services/api';
import './Header.css';

const DEFAULT_NOTIFICATION_PREFS = {
  email_enabled: true,
  frequency: 'immediate',
  severities: ['high', 'medium', 'low'],
  cursor_at: null,
  last_digest_sent_at: null
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const buildNotificationMessage = (alert) => {
  const severity = String(alert?.severity || 'unknown').toUpperCase();
  const signal = alert?.classification || alert?.alert_type || 'Security alert';
  const compactSignal = String(signal).trim().replace(/\s+/g, ' ');
  return `[${severity}] ${compactSignal}`.slice(0, 88);
};

const toTimestamp = (value) => {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return ts;
};

const normalizePrefs = (prefs) => {
  const normalized = { ...DEFAULT_NOTIFICATION_PREFS, ...(prefs || {}) };
  const severities = Array.isArray(normalized.severities)
    ? normalized.severities
      .map((item) => String(item).toLowerCase().trim())
      .filter((item) => ['high', 'medium', 'low'].includes(item))
    : [];
  normalized.severities = severities.length > 0 ? [...new Set(severities)] : ['high', 'medium', 'low'];
  normalized.frequency = normalized.frequency === 'daily' ? 'daily' : 'immediate';
  return normalized;
};

const resolveWindowStart = (prefs) => {
  const cursorTs = toTimestamp(prefs?.cursor_at);
  if (prefs?.frequency !== 'daily') {
    return cursorTs;
  }
  const digestTs = toTimestamp(prefs?.last_digest_sent_at);
  if (cursorTs === null) return digestTs;
  if (digestTs === null) return cursorTs;
  return Math.max(cursorTs, digestTs);
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [notificationsError, setNotificationsError] = useState('');
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotifications([]);
      setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
      return;
    }

    let mounted = true;

    const loadNotifications = async () => {
      try {
        const me = await fetchMe();
        const prefs = normalizePrefs(me?.notification_prefs);
        if (!mounted) return;
        setNotificationPrefs(prefs);
        setNotificationsError('');

        if (!prefs.email_enabled) {
          setNotifications([]);
          return;
        }

        const alerts = await fetchAlerts({ limit: 80, offset: 0 });
        if (!mounted) return;
        const windowStartTs = resolveWindowStart(prefs);
        const allowedSeverities = Array.isArray(prefs.severities) && prefs.severities.length > 0
          ? new Set(prefs.severities.map((s) => String(s).toLowerCase()))
          : new Set(['high', 'medium', 'low']);

        const rows = alerts
          .filter((alert) => {
            if (!allowedSeverities.has(String(alert.severity || '').toLowerCase())) {
              return false;
            }
            if (windowStartTs === null) {
              return true;
            }
            const createdAtTs = toTimestamp(alert?.created_at);
            return createdAtTs !== null && createdAtTs > windowStartTs;
          })
          .slice(0, 8)
          .map((alert) => {
            const createdAt = alert?.created_at ? new Date(alert.created_at) : new Date();
            const ageMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);
            return {
              id: alert.id,
              message: buildNotificationMessage(alert),
              time: formatTimeAgo(alert.created_at),
              read: ageMinutes > 60
            };
          });
        setNotifications(rows);
      } catch (_err) {
        if (!mounted) return;
        setNotifications([]);
        setNotificationsError('Failed to load notifications');
      }
    };

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
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
            className={`header-icon-btn ${!notificationPrefs.email_enabled ? 'is-muted' : ''}`}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
            {notificationPrefs.email_enabled && unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <span className="unread-count">
                  {notificationPrefs.email_enabled ? `${unreadCount} new` : 'off'}
                </span>
              </div>
              <div className="notification-list">
                {!notificationPrefs.email_enabled ? (
                  <div className="notification-empty">
                    Notifications are disabled in Settings.
                  </div>
                ) : notificationsError ? (
                  <div className="notification-empty">{notificationsError}</div>
                ) : notifications.length === 0 ? (
                  <div className="notification-empty">
                    {notificationPrefs.frequency === 'daily'
                      ? 'No alerts in your current daily window.'
                      : 'No recent alerts for your selected severities.'}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    >
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))
                )}
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
