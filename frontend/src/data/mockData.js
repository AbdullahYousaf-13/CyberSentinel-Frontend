// Mock data for CyberSentinel Dashboard

export const mockAlerts = [
  {
    id: 'ALT-2024-001',
    timestamp: '2024-11-24 14:32:15',
    sourceIP: '192.168.1.45',
    attackType: 'DDoS Attack',
    severity: 'High',
    status: 'Active',
    description: 'Distributed Denial of Service attack detected from multiple sources'
  },
  {
    id: 'ALT-2024-002',
    timestamp: '2024-11-24 14:28:43',
    sourceIP: '203.45.67.89',
    attackType: 'SQL Injection',
    severity: 'High',
    status: 'Investigating',
    description: 'SQL injection attempt detected in login form'
  },
  {
    id: 'ALT-2024-003',
    timestamp: '2024-11-24 14:15:22',
    sourceIP: '172.16.0.88',
    attackType: 'Port Scan',
    severity: 'Medium',
    status: 'Active',
    description: 'Port scanning activity detected from external IP'
  },
  {
    id: 'ALT-2024-004',
    timestamp: '2024-11-24 13:30:05',
    sourceIP: '192.0.2.150',
    attackType: 'Malware',
    severity: 'Low',
    status: 'Investigating',
    description: 'Potential malware signature detected in network traffic'
  }
];

export const alertStats = {
  total: 4,
  high: 2,
  medium: 1,
  low: 1
};

// Attack trends data for 24 hours
export const attackTrendsData = [
  { time: '00:00', attacks: 5 },
  { time: '04:00', attacks: 8 },
  { time: '08:00', attacks: 12 },
  { time: '12:00', attacks: 28 },
  { time: '16:00', attacks: 32 },
  { time: '20:00', attacks: 18 }
];

// Attack type distribution data
export const attackTypeDistribution = [
  { name: 'DDoS', value: 35, color: '#FF4444' },
  { name: 'SQL Injection', value: 25, color: '#FF8800' },
  { name: 'Port Scan', value: 20, color: '#FFBB33' },
  { name: 'Malware', value: 15, color: '#00C851' },
  { name: 'Phishing', value: 5, color: '#00E5FF' }
];


