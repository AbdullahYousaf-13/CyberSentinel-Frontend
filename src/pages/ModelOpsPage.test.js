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

  test('shows persisted-version empty state when no versions exist', async () => {
    listRetrainJobs.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText(/no persisted model versions are available yet/i)
    ).toBeInTheDocument();
  });

  test('renders expanded RF and IF metrics when present', async () => {
    listRetrainJobs.mockResolvedValue([
      {
        id: 'job-1',
        status: 'succeeded',
        reason: 'Manual retraining',
        metrics: {
          rf_macro_recall: 0.91,
          rf_macro_f1: 0.89,
          iforest_binary_recall: 0.82,
          iforest_binary_f1: 0.8,
          iforest_gate_recall: 0.4,
          iforest_gate_f1: 0.36,
          samples: 64909,
        },
        result: { version: '20260510144302' },
        error: null,
      },
    ]);
    listModelVersions.mockResolvedValue({
      versions: [
        {
          version: '20260510144302',
          active: true,
          trained_at: '2026-05-10T14:43:08.471963',
          metrics: {
            rf_macro_recall: 0.91,
            rf_macro_f1: 0.89,
            iforest_binary_recall: 0.82,
            iforest_binary_f1: 0.8,
            iforest_gate_recall: 0.4,
            iforest_gate_f1: 0.36,
            samples: 64909,
          },
        },
      ],
    });

    renderPage();

    expect(await screen.findAllByText('91.000%')).toHaveLength(2);
    expect(screen.getAllByText('89.000%')).toHaveLength(2);
    expect(screen.getAllByText('82.000%')).toHaveLength(2);
    expect(screen.getAllByText('80.000%')).toHaveLength(2);
    expect(screen.getAllByText('40.000%')).toHaveLength(2);
    expect(screen.getAllByText('36.000%')).toHaveLength(2);
    expect(screen.getAllByText('64909')).toHaveLength(2);
  });
});
