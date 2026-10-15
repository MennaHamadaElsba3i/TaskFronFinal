import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import { resetServerDb } from '../api.js';

describe('Auto-Save Engine & Undo History Isolation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('increments saveCount reliably on every 5s cycle without freezing at 1', async () => {
    const client = createTestQueryClient();
    renderWithClient(<App />, client);

    expect(screen.getByText(/saves completed: 0/i)).toBeInTheDocument();

    // Advance 5 seconds -> saveCount 1
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/saves completed: 1/i)).toBeInTheDocument();

    // Advance another 5 seconds -> saveCount 2 (confirms stale closure is fixed!)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/saves completed: 2/i)).toBeInTheDocument();

    // Advance another 5 seconds -> saveCount 3
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/saves completed: 3/i)).toBeInTheDocument();
  });

  it('does NOT increment the Undo counter when interacting with row checkboxes', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    const undoButton = screen.getByRole('button', { name: /undo \(0\)/i });
    expect(undoButton).toBeDisabled();

    // Click row checkboxes
    const check101 = screen.getByLabelText('Select task TSK-101');
    const check102 = screen.getByLabelText('Select task TSK-102');

    await user.click(check101);
    await user.click(check102);
    await user.click(check101); // deselect

    // Undo counter MUST remain at 0 because view-only selection is isolated from mutation journal
    expect(screen.getByRole('button', { name: /undo \(0\)/i })).toBeDisabled();
  });
});
