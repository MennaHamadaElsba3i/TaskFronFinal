import React, { useRef, useEffect } from 'react';
import { TaskRow } from './TaskRow.jsx';

export function TaskTable({
  tasks,
  selectedTaskIds,
  onToggleSelect,
  onToggleSelectAllVisible,
  onStockChange,
  onNoteChange,
  sortBy,
  sortOrder,
  onSort,
}) {
  const masterCheckboxRef = useRef(null);

  const visibleSelectedCount = tasks.filter((t) => selectedTaskIds.includes(t.id)).length;
  const isAllVisibleSelected = tasks.length > 0 && visibleSelectedCount === tasks.length;
  const isIndeterminate = visibleSelectedCount > 0 && visibleSelectedCount < tasks.length;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const renderSortIndicator = (column) => {
    if (sortBy !== column) return null;
    return <span className="sort-indicator">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  return (
    <section className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th className="center">
              <input
                ref={masterCheckboxRef}
                type="checkbox"
                aria-label="Select all visible tasks"
                checked={isAllVisibleSelected}
                onChange={onToggleSelectAllVisible}
              />
            </th>
            <th className="sortable-th" onClick={() => onSort('id')}>
              Task ID{renderSortIndicator('id')}
            </th>
            <th className="sortable-th" onClick={() => onSort('title')}>
              Operational Item{renderSortIndicator('title')}
            </th>
            <th className="sortable-th" onClick={() => onSort('category')}>
              Category{renderSortIndicator('category')}
            </th>
            <th className="sortable-th" onClick={() => onSort('priority')}>
              Priority{renderSortIndicator('priority')}
            </th>
            <th className="sortable-th" onClick={() => onSort('status')}>
              Status{renderSortIndicator('status')}
            </th>
            <th className="sortable-th" onClick={() => onSort('stockUnits')}>
              Units{renderSortIndicator('stockUnits')}
            </th>
            <th>Field Dispatch Notes</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty">
                No tasks match the current search or filter criteria.
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isSelected={selectedTaskIds.includes(task.id)}
                onToggleSelect={onToggleSelect}
                onStockChange={onStockChange}
                onNoteChange={onNoteChange}
              />
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
