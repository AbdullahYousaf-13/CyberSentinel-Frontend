import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import './AlertCards.css';

const AlertCards = ({ stats, onDetails }) => {
  const cards = [
    {
      title: 'Total Alerts',
      value: stats.total,
      icon: faShieldAlt,
      color: '#00E5FF',
      borderColor: '#00E5FF',
      key: 'total'
    },
    {
      title: 'High Severity',
      value: stats.high,
      icon: faExclamationTriangle,
      color: '#FF4444',
      borderColor: '#FF4444',
      key: 'high'
    },
    {
      title: 'Medium Severity',
      value: stats.medium,
      icon: faExclamationTriangle,
      color: '#FFBB33',
      borderColor: '#FFBB33',
      key: 'medium'
    },
    {
      title: 'Low Severity',
      value: stats.low,
      icon: faExclamationTriangle,
      color: '#FFBB33',
      borderColor: '#FFBB33',
      key: 'low'
    }
  ];

  return (
    <div className="alert-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className="alert-card"
          style={{ borderColor: card.borderColor }}
        >
          <div className="alert-card-header">
            <FontAwesomeIcon
              icon={card.icon}
              className="alert-card-icon"
              style={{ color: card.color }}
            />
            <span className="alert-card-title">{card.title}</span>
          </div>
          <div className="alert-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="alert-card-actions">
            <button className="details-btn" onClick={() => onDetails && onDetails(card.key)}>
              Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertCards;


