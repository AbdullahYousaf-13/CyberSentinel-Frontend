import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './AttackChart.css';

const AttackChart = ({ data }) => {
  return (
    <div className="attack-chart-container">
      <h2 className="section-title">Attack Trends</h2>
      <div className="attack-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis
              dataKey="time"
              stroke="#8b9dc3"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#8b9dc3"
              style={{ fontSize: '12px' }}
              allowDecimals={false}
              domain={[0, (dataMax) => Math.max(4, Math.ceil(dataMax * 1.2))]}
            />
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
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="attacks"
              stroke="#00E5FF"
              strokeWidth={3}
              dot={{ fill: '#00E5FF', r: 5 }}
              activeDot={{ r: 8 }}
              name="alerts"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttackChart;



