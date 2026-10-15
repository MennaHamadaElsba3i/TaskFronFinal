import React from 'react';

export function MetricsSummary({
  visibleCount,
  totalUnits,
  lowStockCount,
  completedCount,
}) {
  return (
    <section className="grid-4">
      <div className="card stat">
        <span className="label">Visible tasks</span>
        <p className="big">{visibleCount}</p>
      </div>
      <div className="card stat">
        <span className="label">Total stock units</span>
        <p className="big">{totalUnits}</p>
      </div>
      <div className="card stat">
        <span className="label">Low stock items</span>
        <p className="big warn">{lowStockCount}</p>
      </div>
      <div className="card stat">
        <span className="label">Completed</span>
        <p className="big ok">{completedCount}</p>
      </div>
    </section>
  );
}
