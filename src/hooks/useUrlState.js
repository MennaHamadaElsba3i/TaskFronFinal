import { useState, useEffect, useCallback, useRef } from 'react';

const VALID_CATEGORIES = ['All', 'Inventory', 'Hardware', 'Maintenance'];
const VALID_PRIORITIES = ['All', 'Urgent', 'High', 'Medium', 'Low'];
const VALID_SORT_COLUMNS = ['id', 'title', 'category', 'priority', 'status', 'stockUnits'];
const VALID_SORT_ORDERS = ['asc', 'desc'];

const DEFAULTS = {
  q: '',
  category: 'All',
  priority: 'All',
  sort: 'priority',
  order: 'desc',
};

export function parseQueryParams(searchStr) {
  const params = new URLSearchParams(searchStr);

  const rawQ = params.get('q');
  const q = typeof rawQ === 'string' ? rawQ : DEFAULTS.q;

  const rawCategory = params.get('category');
  const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : DEFAULTS.category;

  const rawPriority = params.get('priority');
  const priority = VALID_PRIORITIES.includes(rawPriority) ? rawPriority : DEFAULTS.priority;

  const rawSort = params.get('sort');
  const sort = VALID_SORT_COLUMNS.includes(rawSort) ? rawSort : DEFAULTS.sort;

  const rawOrder = params.get('order');
  const order = VALID_SORT_ORDERS.includes(rawOrder) ? rawOrder : DEFAULTS.order;

  return { q, category, priority, sort, order };
}

export function serializeQueryParams(state) {
  const params = new URLSearchParams();

  if (state.q && state.q.trim()) {
    params.set('q', state.q.trim());
  }
  if (state.category && state.category !== DEFAULTS.category) {
    params.set('category', state.category);
  }
  if (state.priority && state.priority !== DEFAULTS.priority) {
    params.set('priority', state.priority);
  }
  if (state.sort && (state.sort !== DEFAULTS.sort || state.order !== DEFAULTS.order)) {
    params.set('sort', state.sort);
    params.set('order', state.order);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useUrlState() {
  const [urlState, setUrlState] = useState(() => {
    if (typeof window === 'undefined') return { ...DEFAULTS };
    return parseQueryParams(window.location.search);
  });

  const isNavigatingFromPopstate = useRef(false);

  // Sync from browser popstate (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      isNavigatingFromPopstate.current = true;
      const parsed = parseQueryParams(window.location.search);
      setUrlState(parsed);
      // Reset ref after current event loop
      setTimeout(() => {
        isNavigatingFromPopstate.current = false;
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateUrl = useCallback((nextState, action = 'push') => {
    if (typeof window === 'undefined') return;

    const queryString = serializeQueryParams(nextState);
    const newUrl = `${window.location.pathname}${queryString}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (newUrl !== currentUrl && !isNavigatingFromPopstate.current) {
      if (action === 'replace') {
        window.history.replaceState(null, '', newUrl);
      } else {
        window.history.pushState(null, '', newUrl);
      }
    }
  }, []);

  const setUrlParams = useCallback(
    (updater, action = 'push') => {
      setUrlState((prevState) => {
        const nextState =
          typeof updater === 'function' ? updater(prevState) : { ...prevState, ...updater };
        updateUrl(nextState, action);
        return nextState;
      });
    },
    [updateUrl]
  );

  const resetFilters = useCallback(() => {
    setUrlParams({ ...DEFAULTS }, 'push');
  }, [setUrlParams]);

  return {
    urlState,
    setUrlParams,
    resetFilters,
  };
}
