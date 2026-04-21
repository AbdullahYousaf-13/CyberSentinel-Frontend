import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogsPage from './LogsPage';
import { fetchLogCount, fetchLogs } from '../services/api';

jest.mock('../components/layout/Header', () => () => <div data-testid="mock-header" />);
jest.mock('../components/layout/Sidebar', () => () => <div data-testid="mock-sidebar" />);
jest.mock('../services/api', () => ({
  fetchLogCount: jest.fn(),
  fetchLogs: jest.fn()
}));

const getControlWithinLabel = (labelText, selector) => {
  const labelSpan = screen.getByText(labelText);
  const label = labelSpan.closest('label');
  if (!label) throw new Error(`Label not found for ${labelText}`);
  const control = label.querySelector(selector);
  if (!control) throw new Error(`Control ${selector} not found for ${labelText}`);
  return control;
};

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  fetchLogs.mockResolvedValue([]);
  fetchLogCount.mockResolvedValue({ total: 0 });
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('logs filters send source_app, channel, and time range params', async () => {
  render(<LogsPage />);

  await waitFor(() => expect(fetchLogs).toHaveBeenCalled());

  const sourceAppSelect = getControlWithinLabel('Source App', 'select');
  const channelSelect = getControlWithinLabel('Channel', 'select');
  const startInput = getControlWithinLabel('Start', 'input');
  const endInput = getControlWithinLabel('End', 'input');

  userEvent.selectOptions(sourceAppSelect, 'Authentication');
  userEvent.selectOptions(channelSelect, 'Network');
  fireEvent.change(startInput, { target: { value: '2026-04-21T10:00' } });
  fireEvent.change(endInput, { target: { value: '2026-04-21T11:00' } });
  userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

  await waitFor(() => {
    expect(fetchLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source_app: 'Authentication',
        channel: 'Network',
        start_ts: expect.any(String),
        end_ts: expect.any(String)
      })
    );
    expect(fetchLogCount).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source_app: 'Authentication',
        channel: 'Network',
        start_ts: expect.any(String),
        end_ts: expect.any(String)
      })
    );
  });
});
