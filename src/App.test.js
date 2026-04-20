import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('redirects root route to login', async () => {
  window.history.pushState({}, '', '/');
  render(<App />);
  await waitFor(() => {
    expect(window.location.pathname).toBe('/login');
  });
});

test('renders login screen controls', () => {
  window.history.pushState({}, '', '/login');
  render(<App />);

  expect(screen.getByRole('heading', { name: /cybersentinel/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/username\*/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password\*/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /access system/i })).toBeInTheDocument();
});
