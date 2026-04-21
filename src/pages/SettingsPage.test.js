import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import {
  disableTotp,
  fetchMe,
  setupTotp,
  updateNotificationPreferences,
  verifyTotp
} from '../services/api';

jest.mock('../services/api', () => ({
  disableTotp: jest.fn(),
  fetchMe: jest.fn(),
  setupTotp: jest.fn(),
  updateNotificationPreferences: jest.fn(),
  verifyTotp: jest.fn()
}));

const renderSettings = () =>
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <SettingsPage />
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  setupTotp.mockResolvedValue({ provisioning_uri: 'otpauth://abc', totp_secret: 'secret' });
  verifyTotp.mockResolvedValue(null);
  disableTotp.mockResolvedValue(null);
  updateNotificationPreferences.mockResolvedValue({
    email_enabled: true,
    frequency: 'immediate',
    severities: ['high', 'medium', 'low'],
    timezone: 'Asia/Karachi'
  });
});

test('frequency and severity controls are disabled and dimmed when notifications are off', async () => {
  fetchMe.mockResolvedValue({
    is_2fa_enabled: false,
    email_verified: true,
    notification_prefs: {
      email_enabled: false,
      frequency: 'daily',
      severities: ['high'],
      timezone: 'Asia/Karachi'
    }
  });

  renderSettings();

  await waitFor(() => expect(screen.getByLabelText(/Email notifications toggle/i)).not.toBeChecked());
  expect(screen.getByRole('button', { name: /Immediate/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /High Severity/i })).toBeDisabled();
  expect(screen.getByText(/Enable notifications to edit alert frequency/i)).toBeInTheDocument();
});

test('save sends multi-select severities and timezone payload', async () => {
  fetchMe.mockResolvedValue({
    is_2fa_enabled: false,
    email_verified: true,
    notification_prefs: {
      email_enabled: true,
      frequency: 'immediate',
      severities: ['high', 'low'],
      timezone: 'Asia/Karachi'
    }
  });

  renderSettings();

  await waitFor(() => expect(screen.getByLabelText(/Email notifications toggle/i)).toBeChecked());
  userEvent.click(screen.getByRole('button', { name: /Medium Severity/i }));
  userEvent.click(screen.getByRole('button', { name: /Save Settings/i }));

  await waitFor(() =>
    expect(updateNotificationPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        email_enabled: true,
        frequency: 'immediate',
        severities: ['high', 'medium', 'low'],
        timezone: 'Asia/Karachi'
      })
    )
  );
});

test('cannot enable notifications when email is unverified', async () => {
  fetchMe.mockResolvedValue({
    is_2fa_enabled: false,
    email_verified: false,
    notification_prefs: {
      email_enabled: false,
      frequency: 'immediate',
      severities: ['high', 'medium', 'low'],
      timezone: 'Asia/Karachi'
    }
  });

  renderSettings();

  const toggle = await screen.findByLabelText(/Email notifications toggle/i);
  expect(toggle).not.toBeChecked();
  userEvent.click(toggle);

  expect(toggle).not.toBeChecked();
  expect(screen.getByText(/Verify your email address before enabling email notifications/i)).toBeInTheDocument();
});
