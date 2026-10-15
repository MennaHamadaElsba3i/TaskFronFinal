import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import { resetServerDb, SEED_TASKS } from '../api.js';

describe('Inventory Calculation & Validation Integrity', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  it('calculates total stock units strictly as an arithmetic sum, preventing string concatenation', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    // Seed total stock units: 45+12+80+30+150+6+64+9+22+18 = 436
    expect(screen.getByText('436')).toBeInTheDocument();

    // Edit TSK-101 (initial 45) to "50"
    const input101 = screen.getByLabelText('Stock units for task TSK-101');
    await user.clear(input101);
    await user.type(input101, '50');
    await user.tab(); // trigger blur to commit

    // New total must be 436 - 45 + 50 = 441 (NOT a concatenated string like "39150")
    await waitFor(() => {
      expect(screen.getByText('441')).toBeInTheDocument();
    });

    // Wait for in-flight async updateTask (120ms) to finish settling
    await new Promise((r) => setTimeout(r, 200));
  });

  it('does not silently convert empty input to zero or corrupt aggregates', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    const input101 = screen.getByLabelText('Stock units for task TSK-101');
    // Clear the input and blur without typing
    await user.clear(input101);
    await user.tab();

    // The field should revert to its last valid value (45) and not become 0
    expect(input101).toHaveValue(45);
    expect(screen.getByText('436')).toBeInTheDocument();
  });
});
