import { useEffect, useState } from 'react';
import { readLocal, writeLocal } from './store.js';

export const packCode = () => readLocal('pack-code', '');
export const setPackCode = c => writeLocal('pack-code', c);

export async function api(path, { method = 'GET', body, leader } = {}) {
  const h = { Accept: 'application/json' };
  if (body) h['Content-Type'] = 'application/json';
  const code = packCode();
  if (code) h['x-pack-code'] = code;
  if (leader) h['x-leader-passcode'] = leader;
  let res;
  try { res = await fetch(`/api/${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }); }
  catch { const e = new Error('No connection. Check your signal and try again.'); e.offline = true; throw e; }
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json() : null;
  if (!res.ok) {
    if (res.status === 401 && !leader && path !== 'join') setPackCode('');
    const e = new Error(data?.error || (res.status === 404 && !data ? 'The pack server isn\'t running on this deploy.' : `Request failed (${res.status})`));
    e.status = res.status; throw e;
  }
  return data;
}

// Image URLs carry the pack code as ?k= because <img> can't send headers.
export const photoUrl = (id, thumb) => `/api/photos/${id}${thumb ? '/thumb' : ''}?k=${encodeURIComponent(packCode())}`;
export const leaderPhotoUrl = (id, pass, thumb) => `/api/leader/photos/${id}/${thumb ? 'thumb' : 'file'}?lk=${encodeURIComponent(pass)}`;

// Small shared fetch hook with a refresh().
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let stop = false;
    setState(s => ({ ...s, loading: true }));
    api(path).then(data => !stop && setState({ data, error: null, loading: false }))
      .catch(error => !stop && setState(s => ({ data: s.data, error, loading: false })));
    return () => { stop = true; };
  }, [path, tick, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, refresh: () => setTick(x => x + 1) };
}
