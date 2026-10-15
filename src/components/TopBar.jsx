import React from 'react';

export function TopBar({
  undoCount,
  canUndo,
  onUndo,
  onSortByPriority,
  onReverseOrder,
}) {
  return (
    <header className="topbar">
      <div>
        <h1>Inventory &amp; Operations Dispatch</h1>
        <p className="muted">Warehouse maintenance schedules, restock audits and field units.</p>
      </div>
      <div className="actions">
        <button
          className="btn ghost"
          onClick={onUndo}
          disabled={!canUndo}
          title={canUndo ? 'Undo last data mutation' : 'No data mutations to undo'}
        >
          Undo ({undoCount})
        </button>
        <button className="btn primary" onClick={onSortByPriority}>
          Sort by Priority
        </button>
        <button className="btn primary" onClick={onReverseOrder}>
          Reverse Order
        </button>
      </div>
    </header>
  );
}
