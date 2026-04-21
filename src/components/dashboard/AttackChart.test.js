import { render, screen } from '@testing-library/react';
import AttackChart from './AttackChart';

test('renders all-time attack trends title without 24 hours suffix', () => {
  render(<AttackChart data={[]} />);

  expect(screen.getByRole('heading', { name: 'Attack Trends' })).toBeInTheDocument();
  expect(screen.queryByText(/24 Hours/i)).not.toBeInTheDocument();
});
