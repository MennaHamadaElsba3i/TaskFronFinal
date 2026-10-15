import React, { useState, useEffect } from 'react';

export const TaskRow = React.memo(function TaskRow({
  task,
  isSelected,
  onToggleSelect,
  onStockChange,
  onNoteChange,
}) {
  const [localStock, setLocalStock] = useState(String(task.stockUnits ?? 0));
  const [isStockInvalid, setIsStockInvalid] = useState(false);
  const [localNote, setLocalNote] = useState(task.note || '');

  // Synchronize when task data changes externally (e.g. undo, refetch, bulk action)
  useEffect(() => {
    setLocalStock(String(task.stockUnits ?? 0));
    setIsStockInvalid(false);
  }, [task.stockUnits]);

  useEffect(() => {
    setLocalNote(task.note || '');
  }, [task.note]);

  const handleStockInputChange = (e) => {
    const val = e.target.value;
    setLocalStock(val);

    // Validate without silently converting empty string to zero
    if (val === '') {
      setIsStockInvalid(true);
      return;
    }
    const num = Number(val);
    if (!Number.isInteger(num) || num < 0 || isNaN(num)) {
      setIsStockInvalid(true);
    } else {
      setIsStockInvalid(false);
    }
  };

  const commitStockChange = async () => {
    if (localStock === '' || isStockInvalid) {
      // Revert to current valid value if invalid or empty
      setLocalStock(String(task.stockUnits));
      setIsStockInvalid(false);
      return;
    }
    const parsed = parseInt(localStock, 10);
    if (parsed !== task.stockUnits) {
      try {
        await onStockChange(task.id, parsed, task.stockUnits);
      } catch (err) {
        setLocalStock(String(task.stockUnits));
      }
    }
  };

  const handleStockKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setLocalStock(String(task.stockUnits));
      setIsStockInvalid(false);
      e.target.blur();
    }
  };

  const handleNoteInputChange = (e) => {
    setLocalNote(e.target.value);
  };

  const commitNoteChange = () => {
    if (localNote !== (task.note || '')) {
      onNoteChange(task.id, localNote, task.note || '');
    }
  };

  const handleNoteKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setLocalNote(task.note || '');
      e.target.blur();
    }
  };

  const statusClass = task.status ? task.status.replace(/\s+/g, '').toLowerCase() : 'pending';
  const priorityClass = task.priority ? task.priority.toLowerCase() : 'low';

  return (
    <tr className={isSelected ? 'selected' : ''}>
      <td className="center">
        <input
          type="checkbox"
          aria-label={`Select task ${task.id}`}
          checked={isSelected}
          onChange={() => onToggleSelect(task.id)}
        />
      </td>
      <td className="mono strong">{task.id}</td>
      <td>{task.title}</td>
      <td className="muted">{task.category}</td>
      <td>
        <span className={`pill ${priorityClass}`}>{task.priority}</span>
      </td>
      <td>
        <span className={`status ${statusClass}`}>{task.status}</span>
      </td>
      <td>
        <input
          className={`units ${isStockInvalid ? 'input-error' : ''}`}
          type="number"
          min="0"
          step="1"
          value={localStock}
          onChange={handleStockInputChange}
          onBlur={commitStockChange}
          onKeyDown={handleStockKeyDown}
          title={isStockInvalid ? 'Stock units must be a non-negative integer' : undefined}
          aria-label={`Stock units for task ${task.id}`}
        />
      </td>
      <td>
        <input
          className="note"
          type="text"
          placeholder="Quick manager note..."
          value={localNote}
          onChange={handleNoteInputChange}
          onBlur={commitNoteChange}
          onKeyDown={handleNoteKeyDown}
          aria-label={`Field note for task ${task.id}`}
        />
      </td>
    </tr>
  );
});
