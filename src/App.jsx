import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUrlState } from './hooks/useUrlState.js';
import { useTasksQuery } from './hooks/useTasksQuery.js';
import { useActionJournal } from './hooks/useActionJournal.js';
import { TopBar } from './components/TopBar.jsx';
import { AutoSaveWidget } from './components/AutoSaveWidget.jsx';
import { MetricsSummary } from './components/MetricsSummary.jsx';
import { FilterToolbar } from './components/FilterToolbar.jsx';
import { BulkActionBar } from './components/BulkActionBar.jsx';
import { TaskTable } from './components/TaskTable.jsx';

const PRIORITY_WEIGHT = { Urgent: 3, High: 2, Medium: 1, Low: 0 };
const LOW_STOCK_LIMIT = 15;

export default function App() {
  const { urlState, setUrlParams, resetFilters } = useUrlState();
  const { q: searchQuery, category: categoryFilter, priority: priorityFilter, sort: sortBy, order: sortOrder } = urlState;

  const { tasks, isLoading, isFetching, updateTask, batchUpdate, isMutating } = useTasksQuery(
    searchQuery,
    categoryFilter
  );

  const { recordAction, undo, canUndo, undoCount } = useActionJournal();

  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [saveCount, setSaveCount] = useState(0);
  const [lastSavedPayload, setLastSavedPayload] = useState(null);

  // Keep latest state in ref for resilient auto-save without stale closures
  const latestDataRef = useRef({ tasks, priorityFilter, selectedTaskIds, searchQuery, categoryFilter });
  useEffect(() => {
    latestDataRef.current = { tasks, priorityFilter, selectedTaskIds, searchQuery, categoryFilter };
  }, [tasks, priorityFilter, selectedTaskIds, searchQuery, categoryFilter]);

  // Auto-save interval: resilient timer with functional updates, no stale closure
  useEffect(() => {
    let ticks = 5;
    const timer = setInterval(() => {
      ticks -= 1;
      setCountdown(ticks);
      if (ticks === 0) {
        ticks = 5;
        setCountdown(5);
        setSaveCount((prev) => prev + 1);

        const current = latestDataRef.current;
        setLastSavedPayload({
          savedAt: new Date().toLocaleTimeString(),
          storageTarget: 'localStorage (single-browser)',
          persistedRecordsCount: current.tasks.length,
          activeFilters: {
            category: current.categoryFilter,
            priority: current.priorityFilter,
            searchQuery: current.searchQuery || '(none)',
          },
          selectedTaskIds: current.selectedTaskIds,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter and sort tasks immutably
  const displayedTasks = useMemo(() => {
    const filtered = tasks.filter(
      (task) => priorityFilter === 'All' || task.priority === priorityFilter
    );

    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'priority') {
        diff = (PRIORITY_WEIGHT[a.priority] ?? 0) - (PRIORITY_WEIGHT[b.priority] ?? 0);
      } else if (sortBy === 'stockUnits') {
        diff = Number(a.stockUnits) - Number(b.stockUnits);
      } else {
        const valA = String(a[sortBy] ?? '').toLowerCase();
        const valB = String(b[sortBy] ?? '').toLowerCase();
        diff = valA.localeCompare(valB);
      }

      // Stable secondary tie-breaker
      if (diff === 0) {
        diff = a.id.localeCompare(b.id);
      }

      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [tasks, priorityFilter, sortBy, sortOrder]);

  // Derived metrics calculated strictly as numbers
  const totalUnits = useMemo(() => {
    return displayedTasks.reduce((sum, t) => sum + Math.max(0, parseInt(t.stockUnits, 10) || 0), 0);
  }, [displayedTasks]);

  const lowStockCount = useMemo(() => {
    return displayedTasks.filter((t) => (parseInt(t.stockUnits, 10) || 0) < LOW_STOCK_LIMIT).length;
  }, [displayedTasks]);

  const completedCount = useMemo(() => {
    return displayedTasks.filter((t) => t.status === 'Completed').length;
  }, [displayedTasks]);

  const visibleSelectedCount = useMemo(() => {
    return displayedTasks.filter((t) => selectedTaskIds.includes(t.id)).length;
  }, [displayedTasks, selectedTaskIds]);

  // Selection handlers (View-only: never affects Undo history!)
  const handleToggleSelect = useCallback((taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleToggleSelectAllVisible = useCallback(() => {
    const visibleIds = displayedTasks.map((t) => t.id);
    setSelectedTaskIds((prev) => {
      const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => prev.includes(id));
      if (allSelected) {
        const visibleSet = new Set(visibleIds);
        return prev.filter((id) => !visibleSet.has(id));
      } else {
        return Array.from(new Set([...prev, ...visibleIds]));
      }
    });
  }, [displayedTasks]);

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds([]);
  }, []);

  // Filter & Search handlers (URL-driven)
  const handleSearchChange = useCallback(
    (newQuery) => {
      setUrlParams((prev) => ({ ...prev, q: newQuery }), 'replace');
    },
    [setUrlParams]
  );

  const handleCategoryChange = useCallback(
    (newCategory) => {
      setUrlParams((prev) => ({ ...prev, category: newCategory }), 'push');
    },
    [setUrlParams]
  );

  const handlePriorityChange = useCallback(
    (newPriority) => {
      setUrlParams((prev) => ({ ...prev, priority: newPriority }), 'push');
    },
    [setUrlParams]
  );

  // Sorting handlers (URL-driven)
  const handleSortColumn = useCallback(
    (column) => {
      setUrlParams((prev) => {
        if (prev.sort === column) {
          return { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' };
        }
        return { ...prev, sort: column, order: 'asc' };
      }, 'push');
    },
    [setUrlParams]
  );

  const handleSortByPriority = useCallback(() => {
    setUrlParams((prev) => {
      if (prev.sort === 'priority') {
        return { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' };
      }
      return { ...prev, sort: 'priority', order: 'desc' };
    }, 'push');
  }, [setUrlParams]);

  const handleReverseOrder = useCallback(() => {
    setUrlParams((prev) => ({
      ...prev,
      order: prev.order === 'asc' ? 'desc' : 'asc',
    }), 'push');
  }, [setUrlParams]);

  // Data mutation handlers (Recorded in Undo journal)
  const handleStockChange = useCallback(
    async (taskId, nextValue, prevValue) => {
      recordAction({
        type: 'UPDATE_STOCK',
        taskId,
        prevValue,
        nextValue,
      });
      try {
        await updateTask({ id: taskId, patch: { stockUnits: nextValue } });
      } catch (err) {
        // Rollback is automatically handled by TanStack Query onError
        throw err;
      }
    },
    [recordAction, updateTask]
  );

  const handleNoteChange = useCallback(
    async (taskId, nextNote, prevNote) => {
      recordAction({
        type: 'UPDATE_NOTE',
        taskId,
        prevValue: prevNote,
        nextValue: nextNote,
      });
      try {
        await updateTask({ id: taskId, patch: { note: nextNote } });
      } catch (err) {
        // Rollback is automatically handled by TanStack Query onError
      }
    },
    [recordAction, updateTask]
  );

  const handleBulkComplete = useCallback(async () => {
    const targets = tasks.filter((t) => selectedTaskIds.includes(t.id));
    if (targets.length === 0) return;

    recordAction({
      type: 'BULK_COMPLETE',
      items: targets.map((t) => ({ id: t.id, prevStatus: t.status })),
    });

    const updates = targets.map((t) => ({ id: t.id, patch: { status: 'Completed' } }));
    try {
      await batchUpdate(updates);
    } catch (err) {
      // Rollback is automatically handled by TanStack Query onError
    }
  }, [tasks, selectedTaskIds, recordAction, batchUpdate]);

  const handleBulkRestock = useCallback(async () => {
    const targets = tasks.filter((t) => selectedTaskIds.includes(t.id));
    if (targets.length === 0) return;

    recordAction({
      type: 'BULK_RESTOCK',
      items: targets.map((t) => ({ id: t.id, prevUnits: t.stockUnits })),
    });

    const updates = targets.map((t) => ({
      id: t.id,
      patch: { stockUnits: t.stockUnits + 10 },
    }));
    try {
      await batchUpdate(updates);
    } catch (err) {
      // Rollback is automatically handled by TanStack Query onError
    }
  }, [tasks, selectedTaskIds, recordAction, batchUpdate]);

  // Undo data mutation
  const handleUndo = useCallback(() => {
    undo(async (action) => {
      if (action.type === 'UPDATE_STOCK') {
        await updateTask({ id: action.taskId, patch: { stockUnits: action.prevValue } });
      } else if (action.type === 'UPDATE_NOTE') {
        await updateTask({ id: action.taskId, patch: { note: action.prevValue } });
      } else if (action.type === 'BULK_COMPLETE') {
        const updates = action.items.map((item) => ({
          id: item.id,
          patch: { status: item.prevStatus },
        }));
        await batchUpdate(updates);
      } else if (action.type === 'BULK_RESTOCK') {
        const updates = action.items.map((item) => ({
          id: item.id,
          patch: { stockUnits: item.prevUnits },
        }));
        await batchUpdate(updates);
      }
    });
  }, [undo, updateTask, batchUpdate]);

  return (
    <div className="app">
      <TopBar
        undoCount={undoCount}
        canUndo={canUndo}
        onUndo={handleUndo}
        onSortByPriority={handleSortByPriority}
        onReverseOrder={handleReverseOrder}
      />

      <AutoSaveWidget
        countdown={countdown}
        saveCount={saveCount}
        lastSavedPayload={lastSavedPayload}
      />

      <MetricsSummary
        visibleCount={displayedTasks.length}
        totalUnits={totalUnits}
        lowStockCount={lowStockCount}
        completedCount={completedCount}
      />

      <FilterToolbar
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        priorityFilter={priorityFilter}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onPriorityChange={handlePriorityChange}
        onResetFilters={resetFilters}
        isSearching={isFetching}
      />

      <BulkActionBar
        selectedCount={selectedTaskIds.length}
        visibleSelectedCount={visibleSelectedCount}
        onClearSelection={handleClearSelection}
        onBulkRestock={handleBulkRestock}
        onBulkComplete={handleBulkComplete}
        isMutating={isMutating}
      />

      <TaskTable
        tasks={displayedTasks}
        selectedTaskIds={selectedTaskIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAllVisible={handleToggleSelectAllVisible}
        onStockChange={handleStockChange}
        onNoteChange={handleNoteChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSortColumn}
      />
    </div>
  );
}
