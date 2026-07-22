import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons/faShieldAlt';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons/faExclamationTriangle';
import './AlertCards.css';

const AlertCards = ({ stats, activeFilter, onSelect }) => {
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
      color: '#FF8800',
      borderColor: '#FF8800',
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

  const handleKeyDown = (event, key) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(key);
    }
  };

  return (
    <div className="alert-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`alert-card ${activeFilter === card.key ? 'active' : ''}`}
          style={{ 
            borderColor: card.borderColor,
            boxShadow: `0 0 20px ${card.color}66`
          }}
          role="button"
          tabIndex={0}
          onClick={() => onSelect?.(card.key)}
          onKeyDown={(event) => handleKeyDown(event, card.key)}
        >
          <div className="alert-card-header">
            <FontAwesomeIcon
              icon={card.icon}
              className="alert-card-icon"
              style={{ 
                color: card.color,
                filter: `drop-shadow(0 0 8px ${card.color}66)`
              }}
            />
            <span className="alert-card-title">{card.title}</span>
          </div>
          <div className="alert-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertCards;


