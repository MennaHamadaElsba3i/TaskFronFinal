import { useState, useCallback, useRef } from 'react';

/**
 * Action Journal for Application-Level Undo/Redo.
 * 
 * DESIGN PRINCIPLE:
 * Tracks REVERSIBLE DATA MUTATIONS ONLY (stock edits, notes, status changes, bulk ops).
 * View-only changes (selection, search, filtering, sorting) are strictly excluded
 * and never create history entries.
 */
export function useActionJournal() {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isApplyingRef = useRef(false);

  const recordAction = useCallback((action) => {
    if (isApplyingRef.current) return;
    setPast((prev) => [...prev, { ...action, timestamp: Date.now() }]);
    setFuture([]); // clear redo stack on new action
  }, []);

  const undo = useCallback(async (applyInverseFn) => {
    if (past.length === 0) return;

    const actionToUndo = past[past.length - 1];
    isApplyingRef.current = true;
    try {
      if (applyInverseFn) {
        await applyInverseFn(actionToUndo);
      }
      setPast((prev) => prev.slice(0, prev.length - 1));
      setFuture((prev) => [actionToUndo, ...prev]);
    } finally {
      isApplyingRef.current = false;
    }
  }, [past]);

  const redo = useCallback(async (applyForwardFn) => {
    if (future.length === 0) return;

    const actionToRedo = future[0];
    isApplyingRef.current = true;
    try {
      if (applyForwardFn) {
        await applyForwardFn(actionToRedo);
      }
      setFuture((prev) => prev.slice(1));
      setPast((prev) => [...prev, actionToRedo]);
    } finally {
      isApplyingRef.current = false;
    }
  }, [future]);

  return {
    recordAction,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoCount: past.length,
    isApplying: isApplyingRef.current,
  };
}
