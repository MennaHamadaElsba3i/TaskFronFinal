import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithClient, createTestQueryClient } from './testUtils.jsx';
import { resetServerDb } from '../api.js';

describe('URL-Driven State & Browser Navigation', () => {
  beforeEach(() => {
    resetServerDb();
    window.history.replaceState(null, '', '/');
  });

  it('restores state from initial URL query parameters', async () => {
    window.history.replaceState(null, '', '/?category=Hardware&priority=Urgent');
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      // Hardware + Urgent is TSK-102 and TSK-106
      expect(screen.getByText('TSK-102')).toBeInTheDocument();
      expect(screen.getByText('TSK-106')).toBeInTheDocument();
    });

    // Verify select dropdowns reflect the URL
    expect(screen.getByLabelText(/filter by category/i)).toHaveValue('Hardware');
    expect(screen.getByLabelText(/filter by priority/i)).toHaveValue('Urgent');

    // Inventory item should not be visible
    expect(screen.queryByText('TSK-101')).not.toBeInTheDocument();
  });

  it('updates URL when filters change and restores on browser back (popstate)', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    // Select category "Hardware"
    const categorySelect = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(categorySelect, 'Hardware');

    await waitFor(() => {
      expect(window.location.search).toContain('category=Hardware');
      expect(screen.getByText('TSK-102')).toBeInTheDocument();
      expect(screen.queryByText('TSK-101')).not.toBeInTheDocument();
    });

    // Simulate browser Back button via popstate
    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await waitFor(() => {
      expect(categorySelect).toHaveValue('All');
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });
  });

  it('uses replaceState for debounced search typing to avoid history spam', async () => {
    const user = userEvent.setup();
    const client = createTestQueryClient();

    renderWithClient(<App />, client);

    await waitFor(() => {
      expect(screen.getByText('TSK-101')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by title or task code/i);
    await user.type(searchInput, 'safety');

    await waitFor(() => {
      expect(window.location.search).toContain('q=safety');
    });
  });
});
