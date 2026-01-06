import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import './ThreatPie.css';

const ThreatPie = ({ data }) => {
  const COLORS = data.map(item => item.color);

  return (
    <div className="threat-pie-container">
      <h2 className="section-title">Attack Type Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
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
              color: '#ffffff'
            }}
          />
          <Legend
            wrapperStyle={{ color: '#8b9dc3', fontSize: '14px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ThreatPie;


