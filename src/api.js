/**
 * Mock API & In-Memory Task Database
 * 
 * IMPORTANT PERSISTENCE NOTICE:
 * Persistence is backed by browser `localStorage` ('ops_dashboard_tasks_v1').
 * This provides LOCAL, SINGLE-BROWSER STORAGE ONLY. It is NOT a real shared
 * backend or permanent server-side database. If accessed from another browser,
 * device, or incognito session, data will initialize from the seed tasks below.
 */

const STORAGE_KEY = 'ops_dashboard_tasks_v1';

export const SEED_TASKS = [
  { id: 'TSK-101', title: 'Audit warehouse safety supplies', category: 'Inventory', priority: 'High', stockUnits: 45, status: 'In Progress', note: '' },
  { id: 'TSK-102', title: 'Restock barcode scanner batteries', category: 'Hardware', priority: 'Urgent', stockUnits: 12, status: 'Pending', note: '' },
  { id: 'TSK-103', title: 'Recalibrate conveyor scale sensor', category: 'Maintenance', priority: 'Low', stockUnits: 80, status: 'Completed', note: '' },
  { id: 'TSK-104', title: 'Inspect forklift hydraulic fluid', category: 'Maintenance', priority: 'Medium', stockUnits: 30, status: 'In Progress', note: '' },
  { id: 'TSK-105', title: 'Cycle count shelf aisle B4', category: 'Inventory', priority: 'High', stockUnits: 150, status: 'Pending', note: '' },
  { id: 'TSK-106', title: 'Replace thermal printer heads', category: 'Hardware', priority: 'Urgent', stockUnits: 6, status: 'Pending', note: '' },
  { id: 'TSK-107', title: 'Label returned pallet inventory', category: 'Inventory', priority: 'Medium', stockUnits: 64, status: 'Pending', note: '' },
  { id: 'TSK-108', title: 'Service dock door actuators', category: 'Maintenance', priority: 'High', stockUnits: 9, status: 'In Progress', note: '' },
  { id: 'TSK-109', title: 'Update handheld scanner firmware', category: 'Hardware', priority: 'Low', stockUnits: 22, status: 'Pending', note: '' },
  { id: 'TSK-110', title: 'Reconcile damaged goods ledger', category: 'Inventory', priority: 'Urgent', stockUnits: 18, status: 'Pending', note: '' },
];

function loadTasks() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return SEED_TASKS.map((t) => ({ ...t }));
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TASKS.map((t) => ({ ...t }));
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse localStorage tasks, falling back to seed data:', e);
  }
  return SEED_TASKS.map((t) => ({ ...t }));
}

function saveTasks(tasks) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to persist tasks to localStorage:', e);
    }
  }
}

let serverDb = loadTasks();

export const resetServerDb = (initial = SEED_TASKS) => {
  serverDb = initial.map((t) => ({ ...t }));
  saveTasks(serverDb);
  return serverDb;
};

const abortableWait = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true }
      );
    }
  });

export const fetchTasks = async (searchQuery = '', category = 'All', signal) => {
  const q = searchQuery.trim().toLowerCase();
  await abortableWait(q.length === 1 ? 1800 : 250, signal);

  return serverDb
    .filter((task) => {
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q);
      const matchesCategory = category === 'All' || task.category === category;
      return matchesSearch && matchesCategory;
    })
    .map((task) => ({ ...task }));
};

export const updateTask = async (id, patch) => {
  await abortableWait(120);
  const target = serverDb.find((task) => task.id === id);
  if (target) {
    Object.assign(target, patch);
    saveTasks(serverDb);
  }
  return target ? { ...target } : null;
};

export const batchUpdateTasks = async (updates) => {
  await abortableWait(150);
  const updated = [];
  updates.forEach(({ id, patch }) => {
    const target = serverDb.find((task) => task.id === id);
    if (target) {
      Object.assign(target, patch);
      updated.push({ ...target });
    }
  });
  saveTasks(serverDb);
  return updated;
};
