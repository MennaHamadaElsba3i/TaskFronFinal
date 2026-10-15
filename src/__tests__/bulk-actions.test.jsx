import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import { resetServerDb } from '../api.js';

describe('Bulk Actions & Selection Fidelity', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  it('updates ALL selected tasks when executing bulk Mark Complete', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    // Select TSK-101 (In Progress), TSK-102 (Pending), TSK-104 (In Progress)
    const check101 = screen.getByLabelText('Select task TSK-101');
    const check102 = screen.getByLabelText('Select task TSK-102');
    const check104 = screen.getByLabelText('Select task TSK-104');

    await user.click(check101);
    await user.click(check102);
    await user.click(check104);

    expect(document.querySelector('.bulkbar')).toHaveTextContent('3 selected');

    // Click "Mark Complete"
    const markCompleteBtn = screen.getByRole('button', { name: /mark complete/i });
    await user.click(markCompleteBtn);

    // Verify ALL 3 tasks become "Completed"
    await waitFor(() => {
      // Find rows containing TSK-101, TSK-102, TSK-104
      const row101 = screen.getByText('TSK-101').closest('tr');
      const row102 = screen.getByText('TSK-102').closest('tr');
      const row104 = screen.getByText('TSK-104').closest('tr');

      expect(row101).toHaveTextContent('Completed');
      expect(row102).toHaveTextContent('Completed');
      expect(row104).toHaveTextContent('Completed');
    });
  });

  it('updates ALL selected tasks when executing bulk Restock +10', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    // TSK-101 has 45 units; TSK-102 has 12 units
    const check101 = screen.getByLabelText('Select task TSK-101');
    const check102 = screen.getByLabelText('Select task TSK-102');

    await user.click(check101);
    await user.click(check102);

    const restockBtn = screen.getByRole('button', { name: /restock \+10/i });
    await user.click(restockBtn);

    await waitFor(() => {
      expect(screen.getByLabelText('Stock units for task TSK-101')).toHaveValue(55);
      expect(screen.getByLabelText('Stock units for task TSK-102')).toHaveValue(22);
    });
  });

  it('supports tri-state master checkbox and clear selection', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    const masterCheck = screen.getByLabelText('Select all visible tasks');
    expect(masterCheck.checked).toBe(false);

    // Click master checkbox: selects all visible (10)
    await user.click(masterCheck);
    await waitFor(() => {
      expect(masterCheck.checked).toBe(true);
      expect(document.querySelector('.bulkbar')).toHaveTextContent('10 selected');
    });

    // Deselect one item: master checkbox becomes indeterminate
    const check101 = screen.getByLabelText('Select task TSK-101');
    await user.click(check101);
    await waitFor(() => {
      expect(masterCheck.indeterminate).toBe(true);
      expect(document.querySelector('.bulkbar')).toHaveTextContent('9 selected');
    });

    // Click "Clear selection"
    const clearBtn = screen.getByRole('button', { name: /clear selection/i });
    await user.click(clearBtn);
    await waitFor(() => {
      expect(masterCheck.checked).toBe(false);
      expect(masterCheck.indeterminate).toBe(false);
      expect(document.querySelector('.bulkbar')).toHaveTextContent('0 selected');
    });
  });
});
