import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import { resetServerDb } from '../api.js';

describe('Stable Row Identity & Field Dispatch Notes', () => {
  beforeEach(() => {
    resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  it('keeps manager notes strictly bound to their respective task IDs after sorting', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    // Enter note on TSK-101
    const note101 = screen.getByLabelText('Field note for task TSK-101');
    await user.type(note101, 'Emergency audit note for warehouse supplies');
    await user.tab(); // trigger blur to commit

    // Enter note on TSK-102
    const note102 = screen.getByLabelText('Field note for task TSK-102');
    await user.type(note102, 'Restock batteries urgently');
    await user.tab(); // trigger blur to commit

    expect(screen.getByLabelText('Field note for task TSK-101')).toHaveValue(
      'Emergency audit note for warehouse supplies'
    );
    expect(screen.getByLabelText('Field note for task TSK-102')).toHaveValue(
      'Restock batteries urgently'
    );

    // Click "Reverse Order"
    const reverseBtn = screen.getByRole('button', { name: /reverse order/i });
    await user.click(reverseBtn);

    // After reordering, TSK-101's note MUST still be with TSK-101
    expect(screen.getByLabelText('Field note for task TSK-101')).toHaveValue(
      'Emergency audit note for warehouse supplies'
    );
    expect(screen.getByLabelText('Field note for task TSK-102')).toHaveValue(
      'Restock batteries urgently'
    );

    // Click "Sort by Priority"
    const sortPriorityBtn = screen.getByRole('button', { name: /sort by priority/i });
    await user.click(sortPriorityBtn);

    expect(screen.getByLabelText('Field note for task TSK-101')).toHaveValue(
      'Emergency audit note for warehouse supplies'
    );
    expect(screen.getByLabelText('Field note for task TSK-102')).toHaveValue(
      'Restock batteries urgently'
    );
  });
});
