const values = new Map();
const listeners = new Map();

export const state = {
  get(key) {
    return values.get(key);
  },

  set(key, value) {
    values.set(key, value);
    const cbs = listeners.get(key);
    if (cbs) {
      for (const cb of [...cbs]) {
        cb(value);
      }
    }
  },

  on(key, cb) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(cb);
    return () => listeners.get(key).delete(cb);
  },
};
