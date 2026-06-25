import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModelOpsPage from './ModelOpsPage';
import {
  createRetrainJob,
  listModelVersions,
  listRetrainJobs,
  listSuppressions,
} from '../services/api';

jest.mock('../components/layout/Header', () => () => <div>Header</div>);
jest.mock('../components/layout/Sidebar', () => () => <div>Sidebar</div>);
jest.mock('../services/api', () => ({
  activateSuppression: jest.fn(),
  createRetrainJob: jest.fn(),
  deactivateSuppression: jest.fn(),
  listModelVersions: jest.fn(),
  listRetrainJobs: jest.fn(),
  listSuppressions: jest.fn(),
  rollbackModelVersion: jest.fn(),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ModelOpsPage />
    </MemoryRouter>
  );

describe('ModelOpsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listModelVersions.mockResolvedValue({ versions: [] });
    listSuppressions.mockResolvedValue([]);
    createRetrainJob.mockResolvedValue({ id: 'job-1' });
  });

  test('disables Start Retrain when a job is active', async () => {
    listRetrainJobs.mockResolvedValue([
      {
        id: 'job-1',
        status: 'running',
        reason: 'Manual retraining',
        metrics: {},
        result: {},
        error: null,
      },
    ]);

    renderPage();

    const startButton = await screen.findByRole('button', { name: /start retrain/i });
    await waitFor(() => expect(startButton).toBeDisabled());
    expect(screen.getByText(/a retrain job is already active/i)).toBeInTheDocument();
  });

  test('allows manual retrain when no job is active', async () => {
    listRetrainJobs.mockResolvedValue([]);

    renderPage();

    const startButton = await screen.findByRole('button', { name: /start retrain/i });
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);

    await waitFor(() =>
      expect(createRetrainJob).toHaveBeenCalledWith({ reason: 'Manual retraining' })
    );
  });
});
