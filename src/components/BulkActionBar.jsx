import React from 'react';

export function BulkActionBar({
  selectedCount,
  visibleSelectedCount,
  onClearSelection,
  onBulkRestock,
  onBulkComplete,
  isMutating,
}) {
  const hasSelection = selectedCount > 0;

  return (
    <section className="bulkbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>
          <strong>{selectedCount}</strong> selected
          {hasSelection && selectedCount !== visibleSelectedCount && (
            <span className="muted small" style={{ marginLeft: '6px' }}>
              ({visibleSelectedCount} visible)
            </span>
          )}
        </span>
        {hasSelection && (
          <button
            className="btn ghost small"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={onClearSelection}
          >
            Clear selection
          </button>
        )}
      </div>
      <div className="actions">
        <button
          className="btn ghost"
          onClick={onBulkRestock}
          disabled={!hasSelection || isMutating}
        >
          {isMutating ? 'Updating...' : 'Restock +10'}
        </button>
        <button
          className="btn ok"
          onClick={onBulkComplete}
          disabled={!hasSelection || isMutating}
        >
          {isMutating ? 'Updating...' : 'Mark Complete'}
        </button>
      </div>
    </section>
  );
}
