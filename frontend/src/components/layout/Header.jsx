import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUser } from '@fortawesome/free-solid-svg-icons';
import './Header.css';

const Header = () => {
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
        <h1 className="header-title">CYBERSENTINEL DASHBOARD</h1>
      </div>
      <div className="header-right">
        <button className="header-icon-btn">
          <FontAwesomeIcon icon={faBell} />
        </button>
        <button className="header-icon-btn">
          <FontAwesomeIcon icon={faUser} />
        </button>
      </div>
    </header>
  );
};

export default Header;


