import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { fetchAlertAnalytics, fetchAlertCount, fetchAlerts, fetchLogs } from '../services/api';

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
  fetchAlertCount: jest.fn(),
  fetchAlerts: jest.fn(),
  fetchLogs: jest.fn()
}));

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  fetchAlerts.mockResolvedValue([]);
  fetchAlertCount.mockResolvedValue({ count: 24 });
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
    expect(fetchAlertCount).toHaveBeenCalledWith(expect.objectContaining({ severity: undefined, alert_type: undefined }));
  });

  await waitFor(() => {
    expect(screen.getByTestId('attack-chart-props')).toHaveTextContent('"time":"2026-04-20"');
    expect(screen.getByTestId('attack-chart-props')).toHaveTextContent('"attacks":4');
    expect(screen.getByTestId('threat-pie-props')).toHaveTextContent('"name":"Quantum Probe"');
    expect(screen.getByTestId('threat-pie-props')).toHaveTextContent('"value":3');
  });
});

test('find alert placeholder lists only the supported search fields', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByPlaceholderText('Incident ID, Source IP, Model Version')).toBeInTheDocument();
  });
});

test('typing in find alert does not fetch until search is applied', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  fetchAlerts.mockClear();
  fetchAlertCount.mockClear();
  await userEvent.type(screen.getByLabelText(/^Find Alert$/i), '127.0.0.1');

  expect(fetchAlerts).not.toHaveBeenCalled();
  expect(fetchAlertCount).not.toHaveBeenCalled();
});

test('search sends q dates and current existing dashboard filters', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: /^Known Attack$/i }));
  await userEvent.click(screen.getByRole('button', { name: /High Severity/i }));

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ severity: 'high', alert_type: 'known_attack' })
    );
  });

  fetchAlerts.mockClear();
  fetchAlertCount.mockClear();
  await userEvent.type(screen.getByLabelText(/^Find Alert$/i), ' 20260625181323 ');
  fireEvent.change(screen.getByLabelText(/^Start$/i), {
    target: { value: '2026-07-24T13:07' }
  });
  fireEvent.change(screen.getByLabelText(/^End$/i), {
    target: { value: '2026-07-25T09:30' }
  });
  await userEvent.click(screen.getByRole('button', { name: /^Search$/i }));

  const expectedStart = new Date('2026-07-24T13:07');
  expectedStart.setSeconds(0, 0);
  const expectedEnd = new Date('2026-07-25T09:30');
  expectedEnd.setSeconds(59, 999);

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 0,
        severity: 'high',
        alert_type: 'known_attack',
        q: '20260625181323',
        start_ts: expectedStart.toISOString(),
        end_ts: expectedEnd.toISOString()
      })
    );
    expect(fetchAlertCount).toHaveBeenLastCalledWith(
      expect.objectContaining({
        severity: 'high',
        alert_type: 'known_attack',
        q: '20260625181323',
        start_ts: expectedStart.toISOString(),
        end_ts: expectedEnd.toISOString()
      })
    );
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

test('clear resets find and date filters without changing severity or type controls', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: /^Known Attack$/i }));
  await userEvent.click(screen.getByRole('button', { name: /High Severity/i }));
  await userEvent.type(screen.getByLabelText(/^Find Alert$/i), 'model-1');
  fireEvent.change(screen.getByLabelText(/^Start$/i), {
    target: { value: '2026-07-24T13:07' }
  });
  await userEvent.click(screen.getByRole('button', { name: /^Search$/i }));

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'model-1' }));
  });

  fetchAlerts.mockClear();
  fetchAlertCount.mockClear();
  await userEvent.click(screen.getByRole('button', { name: /^Clear$/i }));

  await waitFor(() => {
    const lastAlertsCall = fetchAlerts.mock.calls[fetchAlerts.mock.calls.length - 1][0];
    const lastCountCall = fetchAlertCount.mock.calls[fetchAlertCount.mock.calls.length - 1][0];
    expect(lastAlertsCall).toEqual(
      expect.objectContaining({ limit: 10, offset: 0, severity: 'high', alert_type: 'known_attack' })
    );
    expect(lastAlertsCall.q).toBeUndefined();
    expect(lastAlertsCall.start_ts).toBeUndefined();
    expect(lastAlertsCall.end_ts).toBeUndefined();
    expect(lastCountCall).toEqual(expect.objectContaining({ severity: 'high', alert_type: 'known_attack' }));
    expect(lastCountCall.q).toBeUndefined();
    expect(lastCountCall.start_ts).toBeUndefined();
    expect(lastCountCall.end_ts).toBeUndefined();
  });
});

test('filtered count controls dashboard pagination total', async () => {
  fetchAlertCount
    .mockResolvedValueOnce({ count: 24 })
    .mockResolvedValueOnce({ count: 3 });

  render(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole('button', { name: /^Known Attack$/i }));

  await waitFor(() => {
    expect(fetchAlertCount).toHaveBeenLastCalledWith(expect.objectContaining({ alert_type: 'known_attack' }));
    expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Next Page$/i })).toBeDisabled();
  });
});

test('changing alert-type filter resets pagination to page 1', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(fetchAlerts).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 0 }));
    expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
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
