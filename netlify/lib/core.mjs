// Pack 6 Photo Trail API: photos, albums, family photo permission and
// leader tools. Adapted from the Statewide Synergy conference app's photo
// gallery, with two additions for a youth program:
//   1. Everything sits behind the pack code (PACK_CODE) — nothing is public.
//   2. Families record photo permission per scout, and leaders see each
//      photo checked against it before approving.
//
// Storage-agnostic: `store` is a Netlify Blobs store in production
// (netlify/functions/api.mjs) and a folder store in `npm run dev`.

import pack from '../../pack/pack.js';

const MAX_PHOTO_BYTES = 4.2 * 1024 * 1024;
const MAX_THUMB_BYTES = 400 * 1024;
const LEVELS = pack.consentLevels.map(l => l.id);

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const err = (message, status = 400) => json({ error: message }, status);
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clean = (s, n = 200) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

// "Jamie Rivera" -> "Jamie R."
export function shortName(name) {
  const w = clean(name, 80).split(/\s+/).filter(Boolean);
  if (!w.length) return '';
  return w.length === 1 ? w[0] : `${w[0]} ${w[w.length - 1][0].toUpperCase()}.`;
}
const scoutName = s => `${s.first}${s.lastInitial ? ` ${s.lastInitial}.` : ''}`;

async function listJSON(store, prefix) {
  const { blobs } = await store.list({ prefix });
  const out = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
  return out.filter(Boolean);
}

function decodeImage(dataUrl, max) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  if (bytes.byteLength > max) return { tooBig: true };
  return { type: m[1], bytes };
}

// ---------------------------------------------------------------- albums
async function albums(store, withCounts = true) {
  const custom = (await store.get('albums', { type: 'json' })) || [];
  const list = [...pack.albums.map(a => ({ ...a, builtIn: true })), ...custom];
  if (!withCounts) return list;
  const photos = (await listJSON(store, 'photos/meta/')).filter(p => p.status === 'approved').sort((a, b) => b.at - a.at);
  return list.map(a => {
    const inAlbum = photos.filter(p => p.album === a.id);
    return { ...a, count: inAlbum.length, cover: inAlbum[0]?.id || null };
  });
}

// ---------------------------------------------------------------- consent
async function roster(store) {
  const fams = await listJSON(store, 'consents/');
  const scouts = fams.flatMap(f => f.scouts.map(s => ({ ...s, familyId: f.id, parent: f.parent.name, updated: f.updated })));
  const order = d => { const i = pack.dens.indexOf(d); return i < 0 ? 99 : i; };
  return scouts.sort((a, b) => order(a.den) - order(b.den) || a.first.localeCompare(b.first));
}

async function saveConsent(store, body, now) {
  if (!body.agreed) return err('Check the box to confirm you\'re the scout\'s parent or guardian.');
  const parent = { name: clean(body.parent?.name, 80), email: clean(body.parent?.email, 160).toLowerCase(), phone: clean(body.parent?.phone, 40) };
  if (!parent.name) return err('Add your name.');
  const signature = clean(body.signature, 80);
  if (!signature) return err('Type your name to sign.');
  const scouts = (Array.isArray(body.scouts) ? body.scouts : []).slice(0, 8).map(s => ({
    id: /^s-[a-z0-9]{6,20}$/.test(s.id || '') ? s.id : `s-${rid()}`,
    first: clean(s.first, 40),
    lastInitial: clean(s.lastInitial, 2).replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase(),
    den: pack.dens.includes(s.den) ? s.den : '',
    level: LEVELS.includes(s.level) ? s.level : '',
  })).filter(s => s.first);
  if (!scouts.length) return err('Add at least one scout.');
  if (scouts.some(s => !s.level)) return err('Pick a photo choice for each scout.');

  let id = /^f-[a-z0-9]{6,24}$/.test(body.familyId || '') ? body.familyId : null;
  const prev = id ? await store.get(`consents/${id}`, { type: 'json' }) : null;
  if (!prev) id = `f-${rid()}${rid().slice(-4)}`;
  const rec = {
    id, parent, scouts, signature, agreed: true,
    created: prev?.created || now, updated: now,
    history: [...(prev?.history || []), { at: now, by: signature, levels: scouts.map(s => `${scoutName(s)}: ${s.level}`) }].slice(-20),
  };
  await store.setJSON(`consents/${id}`, rec);
  return json({ ok: true, familyId: id, record: publicConsent(rec) });
}
const publicConsent = r => ({ id: r.id, parent: r.parent, scouts: r.scouts, signature: r.signature, updated: r.updated });

// Check one photo against the families' choices.
function checkPhoto(photo, scoutsById) {
  const tagged = (photo.scouts || []).map(id => scoutsById.get(id)).filter(Boolean);
  const levels = tagged.map(s => s.level);
  let flag;
  if (levels.includes('none')) flag = 'blocked';
  else if (!tagged.length) flag = 'untagged';
  else if (levels.every(l => l === 'public')) flag = 'public';
  else flag = 'pack';
  return { flag, tagged: tagged.map(s => ({ id: s.id, name: scoutName(s), den: s.den, level: s.level })), missing: (photo.scouts || []).length - tagged.length };
}

// ---------------------------------------------------------------- photos
async function addPhoto(store, body, now) {
  if (!body.release) return err('Agree to the sharing rules to share photos.');
  const name = clean(body.name, 80);
  if (!name) return err('Add your name so leaders know who shared it.');
  const img = decodeImage(body.image, MAX_PHOTO_BYTES);
  if (!img) return err('That file isn\'t a photo.');
  if (img.tooBig) return err('That photo is too large.');
  const thumb = decodeImage(body.thumb, MAX_THUMB_BYTES);
  const known = new Set((await albums(store, false)).map(a => a.id));
  const id = rid();
  const meta = {
    id, name, display: shortName(name), role: body.role === 'leader' ? 'leader' : 'parent',
    album: known.has(body.album) ? body.album : 'fun',
    den: pack.dens.includes(body.den) ? body.den : '',
    scouts: (Array.isArray(body.scouts) ? body.scouts : []).slice(0, 30).map(s => clean(s, 30)).filter(Boolean),
    caption: clean(body.caption, 200),
    status: pack.photos.requireApproval ? 'pending' : 'approved', public: false,
    type: img.type, size: img.bytes.byteLength, at: now,
  };
  await store.set(`photos/img/${id}`, img.bytes, { metadata: { type: img.type } });
  if (thumb && !thumb.tooBig) await store.set(`photos/thumb/${id}`, thumb.bytes, { metadata: { type: thumb.type } });
  await store.setJSON(`photos/meta/${id}`, meta);
  return json({ ok: true, id, status: meta.status });
}

async function photoList(store) {
  const metas = (await listJSON(store, 'photos/meta/')).filter(p => p.status === 'approved');
  metas.sort((a, b) => b.at - a.at);
  return metas.map(({ id, display, caption, at, album, den }) => ({ id, name: display, caption, at, album, den }));
}

async function photoFile(store, id, { leader = false, thumb = false } = {}) {
  const meta = await store.get(`photos/meta/${clean(id, 40)}`, { type: 'json' });
  if (!meta || (meta.status !== 'approved' && !leader)) return new Response('Not found', { status: 404 });
  let res = thumb ? await store.getWithMetadata(`photos/thumb/${meta.id}`, { type: 'arrayBuffer' }) : null;
  res ||= await store.getWithMetadata(`photos/img/${meta.id}`, { type: 'arrayBuffer' });
  if (!res) return new Response('Not found', { status: 404 });
  return new Response(res.data, { headers: { 'content-type': res.metadata?.type || meta.type || 'image/jpeg', 'cache-control': leader ? 'no-store' : 'private, max-age=86400' } });
}

// ---------------------------------------------------------------- CSV
function toCSV(rows) {
  const cols = [...rows.reduce((s, r) => { Object.keys(r).forEach(k => s.add(k)); return s; }, new Set())];
  const esc = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}
const iso = t => new Date(t).toISOString();

async function exportCSV(store, kind) {
  let rows;
  if (kind === 'permissions') {
    rows = (await roster(store)).map(s => ({
      scout: scoutName(s), den: s.den, photo_choice: pack.consentLevels.find(l => l.id === s.level)?.label || s.level,
      parent: s.parent, updated: iso(s.updated),
    }));
  } else if (kind === 'photos') {
    const byId = new Map((await roster(store)).map(s => [s.id, s]));
    const all = (await listJSON(store, 'photos/meta/')).sort((a, b) => a.at - b.at);
    rows = all.map(p => {
      const c = checkPhoto(p, byId);
      return { id: p.id, shared_by: p.name, album: p.album, den: p.den, caption: p.caption, status: p.status, ok_for_public: p.public ? 'yes' : '', permission_check: c.flag, scouts_tagged: c.tagged.map(t => t.name).join('; '), shared: iso(p.at), file: `/api/leader/photos/${p.id}/file` };
    });
  } else return err('Unknown export.');
  return new Response(toCSV(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${pack.id}-${kind}.csv"` } });
}

// ---------------------------------------------------------------- leaders
async function leader(store, req, parts, body, now) {
  const [what, id, sub] = parts;
  if (what === 'check') return json({ ok: true });
  if (what === 'photos' && req.method === 'GET' && id && sub === 'file') return photoFile(store, id, { leader: true });
  if (what === 'photos' && req.method === 'GET' && id && sub === 'thumb') return photoFile(store, id, { leader: true, thumb: true });
  if (what === 'photos' && req.method === 'GET') {
    const byId = new Map((await roster(store)).map(s => [s.id, s]));
    const all = (await listJSON(store, 'photos/meta/')).sort((a, b) => b.at - a.at);
    return json({ photos: all.map(p => ({ ...p, check: checkPhoto(p, byId) })) });
  }
  if (what === 'photos' && req.method === 'POST' && id) {
    const meta = await store.get(`photos/meta/${clean(id, 40)}`, { type: 'json' });
    if (!meta) return err('Not found', 404);
    if (body.status === 'deleted') {
      for (const k of ['meta', 'img', 'thumb']) await store.delete(`photos/${k}/${meta.id}`);
      return json({ ok: true });
    }
    if (body.status !== undefined) {
      if (!['approved', 'hidden', 'pending'].includes(body.status)) return err('Bad status');
      meta.status = body.status;
    }
    if (body.public !== undefined) {
      if (body.public) {
        const c = checkPhoto(meta, new Map((await roster(store)).map(s => [s.id, s])));
        if (c.flag !== 'public') return err('Every scout tagged in this photo needs public permission first.');
      }
      meta.public = !!body.public;
    }
    if (Array.isArray(body.scouts)) meta.scouts = body.scouts.slice(0, 30).map(s => clean(s, 30)).filter(Boolean);
    if (body.album !== undefined) {
      const known = new Set((await albums(store, false)).map(a => a.id));
      if (known.has(body.album)) meta.album = body.album;
    }
    await store.setJSON(`photos/meta/${meta.id}`, meta);
    return json({ ok: true, photo: meta });
  }
  if (what === 'permissions' && req.method === 'GET') {
    const fams = (await listJSON(store, 'consents/')).sort((a, b) => b.updated - a.updated);
    return json({ families: fams });
  }
  if (what === 'permissions' && req.method === 'DELETE' && id) {
    await store.delete(`consents/${clean(id, 40)}`); return json({ ok: true });
  }
  if (what === 'albums' && req.method === 'GET') return json({ albums: await albums(store) });
  if (what === 'albums' && req.method === 'POST') {
    const title = clean(body.title, 60);
    if (!title) return err('Give the album a name.');
    const custom = (await store.get('albums', { type: 'json' })) || [];
    const a = { id: `a-${rid()}`, title, emoji: clean(body.emoji, 8) || '📷', date: clean(body.date, 10) || undefined };
    await store.setJSON('albums', [...custom, a]);
    return json({ ok: true, album: a });
  }
  if (what === 'albums' && req.method === 'DELETE' && id) {
    const custom = (await store.get('albums', { type: 'json' })) || [];
    const inUse = (await listJSON(store, 'photos/meta/')).some(p => p.album === id);
    if (inUse) return err('Move or delete this album\'s photos first.');
    await store.setJSON('albums', custom.filter(a => a.id !== id));
    return json({ ok: true });
  }
  if (what === 'export') return exportCSV(store, id);
  if (what === 'stats') {
    const [photos, fams] = await Promise.all([listJSON(store, 'photos/meta/'), listJSON(store, 'consents/')]);
    const scouts = fams.flatMap(f => f.scouts);
    return json({
      pending: photos.filter(p => p.status === 'pending').length, approved: photos.filter(p => p.status === 'approved').length,
      families: fams.length, scouts: scouts.length,
      levels: Object.fromEntries(LEVELS.map(l => [l, scouts.filter(s => s.level === l).length])),
    });
  }
  return err('Not found', 404);
}

// opts: { store, packCode, leaderPasscode }
export async function handle(req, opts) {
  const { store } = opts;
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/(?:api|\.netlify\/functions\/api)\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const now = Date.now();

  let body = {};
  if (req.method === 'POST') { try { body = await req.json(); } catch { return err('Bad request'); } }

  try {
    const [head, ...rest] = parts;
    if (head === 'health') return json({ ok: true, app: pack.id });

    if (!opts.packCode) return err('The pack code isn\'t set yet. Add PACK_CODE in Netlify → Site configuration → Environment variables.', 503);
    if (head === 'join' && req.method === 'POST') {
      return same(body.code, opts.packCode) ? json({ ok: true }) : err('That pack code doesn\'t match. Check with your den leader.', 401);
    }

    if (head === 'leader') {
      if (!opts.leaderPasscode) return err('Leader tools are off. Add LEADER_PASSCODE in Netlify → Site configuration → Environment variables.', 403);
      const given = req.headers.get('x-leader-passcode') || url.searchParams.get('lk');
      if (given !== opts.leaderPasscode) return err('Wrong leader passcode.', 401);
      return leader(store, req, rest, body, now);
    }

    // Everything else is for pack families only.
    const code = req.headers.get('x-pack-code') || url.searchParams.get('k');
    if (!same(code, opts.packCode)) return err('Enter the pack code to continue.', 401);

    if (head === 'albums' && req.method === 'GET') return json({ albums: await albums(store) });
    if (head === 'photos' && req.method === 'GET' && rest[0]) return photoFile(store, rest[0], { thumb: rest[1] === 'thumb' });
    if (head === 'photos' && req.method === 'GET') return json({ photos: await photoList(store) });
    if (head === 'photos' && req.method === 'POST') return addPhoto(store, body, now);
    if (head === 'roster' && req.method === 'GET') {
      // Names only (first name + last initial) so families can tag scouts in photos.
      return json({ scouts: (await roster(store)).map(s => ({ id: s.id, name: scoutName(s), den: s.den })) });
    }
    if (head === 'consent' && req.method === 'POST') return saveConsent(store, body, now);
    if (head === 'consent' && req.method === 'GET' && rest[0]) {
      const r = await store.get(`consents/${clean(rest[0], 40)}`, { type: 'json' });
      return r ? json({ record: publicConsent(r) }) : err('Not found', 404);
    }
    return err('Not found', 404);
  } catch (e) {
    console.error(e);
    return err('Something went wrong on the server.', 500);
  }
}
