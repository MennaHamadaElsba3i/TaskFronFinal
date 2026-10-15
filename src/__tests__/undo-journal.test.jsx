import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import { resetServerDb } from '../api.js';

describe('Application-Level Undo Journal', () => {
  beforeEach(() => {
    resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  it('records stock edits in the Undo journal and successfully inverts them upon clicking Undo', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    const input101 = screen.getByLabelText('Stock units for task TSK-101');
    expect(input101).toHaveValue(45);

    // Edit stock units: 45 -> 60
    await user.clear(input101);
    await user.type(input101, '60');
    await user.tab();

    await waitFor(() => {
      expect(input101).toHaveValue(60);
      expect(screen.getByRole('button', { name: /undo \(1\)/i })).toBeEnabled();
    });

    // Click Undo
    const undoBtn = screen.getByRole('button', { name: /undo \(1\)/i });
    await user.click(undoBtn);

    // Should revert back to 45 and undo count should decrement to 0
    await waitFor(() => {
      expect(input101).toHaveValue(45);
      expect(screen.getByRole('button', { name: /undo \(0\)/i })).toBeDisabled();
    });
  });
});
