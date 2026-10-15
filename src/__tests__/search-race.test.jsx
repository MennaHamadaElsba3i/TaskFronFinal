import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import { resetServerDb, SEED_TASKS } from '../api.js';

describe('Search Correctness & Race Condition Prevention', () => {
  beforeEach(() => {
    resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  it('prevents older slow search responses from overwriting newer fast results', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    // Initial tasks load
    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by title or task code/i);

    // Type "A" (which takes 1800ms) then immediately type "Au" (which takes 250ms)
    await user.type(searchInput, 'A');
    await user.type(searchInput, 'u');

    // Wait for the query to commit and display results for "Au"
    await waitFor(
      () => {
        // "Audit warehouse safety supplies" matches "Au"
        expect(screen.getByText('TSK-101')).toBeInTheDocument();
        // Tasks that do NOT match "Au" should not be displayed
        expect(screen.queryByText('TSK-102')).not.toBeInTheDocument();
      },
      { timeout: 3500 }
    );

    // Even after 2500ms (when any stale "A" response would have resolved), the table must still show "Au" results
    await new Promise((r) => setTimeout(r, 2000));
    expect(screen.getByText('TSK-101')).toBeInTheDocument();
    expect(screen.queryByText('TSK-102')).not.toBeInTheDocument();
  });
});
