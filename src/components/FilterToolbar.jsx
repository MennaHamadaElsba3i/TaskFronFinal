import React, { useState, useEffect, useRef } from 'react';

export function FilterToolbar({
  searchQuery,
  categoryFilter,
  priorityFilter,
  onSearchChange,
  onCategoryChange,
  onPriorityChange,
  onResetFilters,
  isSearching,
}) {
  const [localInput, setLocalInput] = useState(searchQuery);
  const debounceTimerRef = useRef(null);

  // Sync if URL search changes externally (e.g. popstate back/forward or reset)
  useEffect(() => {
    setLocalInput(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasActiveFilters =
    searchQuery !== '' || categoryFilter !== 'All' || priorityFilter !== 'All';

  return (
    <section className="card toolbar">
      <div className="search">
        <input
          type="text"
          value={localInput}
          onChange={handleInputChange}
          placeholder="Search by title or task code..."
          aria-label="Search tasks"
        />
        {isSearching && <span className="querying">Querying...</span>}
      </div>
      <div className="filters">
        <label>
          Category
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All</option>
            <option value="Inventory">Inventory</option>
            <option value="Hardware">Hardware</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </label>
        <label>
          Priority
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="All">All</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        {hasActiveFilters && (
          <button
            className="btn ghost small"
            style={{ padding: '6px 10px', fontSize: '12px', alignSelf: 'center' }}
            onClick={onResetFilters}
          >
            Reset
          </button>
        )}
      </div>
    </section>
  );
}
