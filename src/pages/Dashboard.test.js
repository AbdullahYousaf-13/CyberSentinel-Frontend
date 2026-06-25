import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { fetchAlertAnalytics, fetchAlerts, fetchLogs } from '../services/api';

jest.mock('../components/layout/Header', () => () => <div data-testid="mock-header" />);
jest.mock('../components/layout/Sidebar', () => () => <div data-testid="mock-sidebar" />);
jest.mock('../components/dashboard/AlertsTable', () => () => <div data-testid="mock-alerts-table" />);
jest.mock('../components/dashboard/AttackChart', () => ({ data }) => (
  <div data-testid="attack-chart-props">{JSON.stringify(data)}</div>
));
jest.mock('../components/dashboard/ThreatPie', () => ({ data }) => (
  <div data-testid="threat-pie-props">{JSON.stringify(data)}</div>
));
jest.mock('../services/api', () => ({
  fetchAlertAnalytics: jest.fn(),
  fetchAlerts: jest.fn(),
  fetchLogs: jest.fn()
}));

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  fetchAlerts.mockResolvedValue([]);
  fetchLogs.mockResolvedValue([]);
  fetchAlertAnalytics.mockResolvedValue({
    trend: {
      unit: 'day',
      points: [
        {
          bucket_start: '2026-04-20T00:00:00Z',
          bucket_end: '2026-04-21T00:00:00Z',
          label: '2026-04-20',
          count: 4
        }
      ]
    },
    distribution: [
      { key: 'quantum_probe', label: 'Quantum Probe', count: 3, percentage: 75.0 },
      { key: 'ssh_brute', label: 'Ssh Brute', count: 1, percentage: 25.0 }
    ],
    severity_counts: { total: 24, high: 8, medium: 8, low: 8 },
    total_alerts: 24,
    first_alert_at: '2026-04-20T00:00:00Z',
    last_alert_at: '2026-04-21T00:00:00Z'
  });
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('uses analytics API data for charts and keeps alerts pagination fetch', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(fetchAlertAnalytics).toHaveBeenCalledTimes(1);
    expect(fetchAlerts).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  await waitFor(() => {
    expect(screen.getByTestId('attack-chart-props')).toHaveTextContent('"time":"2026-04-20"');
    expect(screen.getByTestId('attack-chart-props')).toHaveTextContent('"attacks":4');
    expect(screen.getByTestId('threat-pie-props')).toHaveTextContent('"name":"Quantum Probe"');
    expect(screen.getByTestId('threat-pie-props')).toHaveTextContent('"value":3');
  });
});

test('refresh reloads analytics endpoint', async () => {
  render(<Dashboard />);

  await waitFor(() => expect(fetchAlertAnalytics).toHaveBeenCalledTimes(1));

  await userEvent.click(screen.getByRole('button', { name: /^Refresh Analytics$/i }));

  await waitFor(() => expect(fetchAlertAnalytics).toHaveBeenCalledTimes(2));
});

test('known attack filter sends alert_type query param', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  await userEvent.click(screen.getByRole('button', { name: /^Known Attack$/i }));

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 10, offset: 0, alert_type: 'known_attack' })
    );
  });
});

test('anomaly filter combines with severity filter', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  await userEvent.click(screen.getByRole('button', { name: /^Anomaly$/i }));
  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 10, offset: 0, alert_type: 'anomaly' })
    );
  });

  await userEvent.click(screen.getByRole('button', { name: /High Severity/i }));

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 10, offset: 0, severity: 'high', alert_type: 'anomaly' })
    );
  });
});

test('changing alert-type filter resets pagination to page 1', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  await userEvent.click(screen.getByRole('button', { name: /^Next Page$/i }));

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 10, offset: 10 }));
  });

  await userEvent.click(screen.getByRole('button', { name: /^Known Attack$/i }));

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 10, offset: 0, alert_type: 'known_attack' })
    );
  });

  expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
});
