import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import './ThreatPie.css';

const ThreatPie = ({ data }) => {
  const COLORS = data.map(item => item.color);
  const total = data.reduce((sum, row) => sum + Number(row.value || 0), 0);
  const toPct = (count) => {
    if (!total) return '0.000%';
    return `${((Number(count || 0) / total) * 100).toFixed(3)}%`;
  };

  return (
    <div className="threat-pie-container">
      <h2 className="section-title">Attack Type Distribution</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            innerRadius={50}
            outerRadius={88}
            minAngle={3}
            paddingAngle={1}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f1629',
              border: '1px solid #1a2332',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#FFFFFF' }}
            itemStyle={{ color: '#FFFFFF' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="threat-legend-grid">
        {data.map((entry, index) => (
          <div className="threat-legend-item" key={`${entry.name}-${index}`}>
            <span className="threat-legend-dot" style={{ backgroundColor: entry.color }} />
            <span className="threat-legend-text">
              {entry.name} {toPct(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreatPie;



