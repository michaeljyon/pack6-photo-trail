import { useCallback, useEffect, useState } from 'react';
import { pack } from './config.js';

// Saved on this phone only, keyed by the app id.
const PREFIX = `${pack.id}:`;
const subs = new Map();

export function readLocal(key, fallback) {
  try { const v = localStorage.getItem(PREFIX + key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
export function writeLocal(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* full or blocked */ }
  (subs.get(key) || []).forEach(fn => fn(value));
}
export function useLocal(key, fallback) {
  const [v, setV] = useState(() => readLocal(key, fallback));
  useEffect(() => {
    subs.set(key, [...(subs.get(key) || []), setV]);
    return () => subs.set(key, (subs.get(key) || []).filter(f => f !== setV));
  }, [key]);
  const set = useCallback(next => writeLocal(key, typeof next === 'function' ? next(readLocal(key, fallback)) : next), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, set];
}

// The adult using this phone (shared by the camera and permission screens).
export const useMe = () => useLocal('me', { name: '', role: 'parent' });
