import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import * as api from '../api.js';

describe('Optimistic Mutation & Rollback on Error', () => {
  beforeEach(() => {
    api.resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  it('rolls back optimistic stock update when the network mutation rejects', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    // Mock updateTask to reject with error
    const spy = vi.spyOn(api, 'updateTask').mockRejectedValueOnce(new Error('Network failure'));

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    const input101 = screen.getByLabelText('Stock units for task TSK-101');
    expect(input101).toHaveValue(45);

    // Edit stock
    await user.clear(input101);
    await user.type(input101, '88');
    await user.tab();

    // Because updateTask rejects, it rolls back to 45
    await waitFor(() => {
      expect(input101).toHaveValue(45);
    });

    spy.mockRestore();
  });
});
