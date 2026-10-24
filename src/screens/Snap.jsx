import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHead, Section } from '../components/ui.jsx';
import { pack, t } from '../lib/config.js';
import { useLocal, useMe } from '../lib/store.js';
import { api, useApi } from '../lib/api.js';
import { resizeImage } from '../lib/image.js';

// Share a photo. Built from the Statewide Synergy app's photo feature:
// shrink on the phone, agree to the sharing rules once, send, and wait for
// approval. Added for the pack: albums, dens and tagging scouts so leaders
// can check every photo against each family's permission.
export default function Snap() {
  const [me, setMe] = useMe();
  const [agreed, setAgreed] = useLocal('share-rules', false);
  const [mine, setMine] = useLocal('my-photos', []);
  const [album, setAlbum] = useLocal('last-album', pack.albums[0].id);
  const [den, setDen] = useLocal('last-den', '');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const take = useRef(null), pick = useRef(null);
  const albums = useApi('albums');
  const roster = useApi('roster');
  const gallery = useApi('photos');
  const ready = me.name.trim() && agreed;
  const [setupOpen, setSetupOpen] = useState(!ready);
  const list = albums.data?.albums || pack.albums;

  // Mark my photos that have since been approved.
  useEffect(() => {
    const live = new Set((gallery.data?.photos || []).map(p => p.id));
    if (!live.size) return;
    setMine(m => m.map(p => (p.status === 'pending' && live.has(p.id) ? { ...p, status: 'approved' } : p)));
  }, [gallery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onFiles(files) {
    if (!files?.length) return;
    const all = [...files].slice(0, pack.photos.maxPerUpload);
    setMsg(null);
    let sent = 0;
    for (const [i, file] of all.entries()) {
      setBusy(all.length > 1 ? `Sending ${i + 1} of ${all.length}…` : 'Sending…');
      const thumb = await resizeImage(file, 480, 0.72).catch(() => '');
      try {
        const image = await resizeImage(file);
        const r = await api('photos', { method: 'POST', body: { image, thumb, name: me.name, role: me.role, album, den, scouts: tags, caption, release: true } });
        setMine(m => [{ id: r.id, status: r.status, thumb, caption, album, at: Date.now() }, ...m].slice(0, 60));
        sent++;
      } catch (e) {
        setMine(m => [{ id: `local-${Date.now()}-${i}`, status: 'failed', thumb, caption, album, at: Date.now() }, ...m].slice(0, 60));
        setMsg({ bad: true, text: e.status ? e.message : 'A photo couldn\'t send (weak signal?). Try again in a minute.' });
      }
    }
    setBusy('');
    if (sent) {
      setCaption(''); setTags([]);
      setMsg(m => m || { text: pack.photos.requireApproval ? `${sent} photo${sent > 1 ? 's' : ''} sent! A leader will approve ${sent > 1 ? 'them' : 'it'} soon.` : `${sent} photo${sent > 1 ? 's' : ''} added to the gallery!` });
    }
  }

  return (
    <div className="content">
      <PageHead title="Snap & share" sub={`Share a moment from ${pack.unit}. Leaders check every photo before pack families see it.`} />

      {!setupOpen && (
        <p className="sharing-as"><Icon name="user" size={18} /><span>Sharing as <b>{me.name}</b> · {me.role === 'leader' ? 'Leader' : 'Parent or guardian'}</span><button className="link-btn small" onClick={() => setSetupOpen(true)}>Change</button></p>
      )}
      {setupOpen && (
        <Section title={ready ? 'You\'re all set ✓' : 'First, a quick setup'} className={`setup ${ready ? 'done' : ''}`}>
          <div className="card">
            <label className="field"><span>Your name</span><input value={me.name} onChange={e => setMe({ ...me, name: e.target.value })} autoComplete="name" placeholder="First and last name" /></label>
            <div className="field"><span>I'm a…</span>
              <div className="seg" role="radiogroup" aria-label="I'm a">
                {[['parent', 'Parent or guardian'], ['leader', 'Leader']].map(([id, l]) => (
                  <button key={id} type="button" role="radio" aria-checked={me.role === id} className={me.role === id ? 'on' : ''} onClick={() => setMe({ ...me, role: id })}>{l}</button>
                ))}
              </div>
            </div>
            <div className="rules">
              <p className="rules-title"><Icon name="shield" size={18} /> Sharing rules</p>
              <ul>{pack.shareRules.map((r, i) => <li key={i}>{t(r)}</li>)}</ul>
            </div>
            <label className="check"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /> I agree to these rules for every photo I share.</label>
            {ready && <button className="link-btn small" onClick={() => setSetupOpen(false)}>Done</button>}
          </div>
        </Section>
      )}

      <Section title="Which album?">
        <div className="chip-scroll" role="radiogroup" aria-label="Album">
          {list.map(a => <button key={a.id} role="radio" aria-checked={album === a.id} className={`chip big ${album === a.id ? 'on' : ''}`} onClick={() => setAlbum(a.id)}><span aria-hidden="true">{a.emoji}</span> {a.title}</button>)}
        </div>
      </Section>

      <Section title="Add details" action={<span className="small muted">Optional</span>}>
        <div className="card">
          <label className="field"><span>Den</span>
            <select value={den} onChange={e => setDen(e.target.value)}>
              <option value="">Whole pack / mixed</option>
              {pack.dens.map(d => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="field"><span>Caption</span><input value={caption} onChange={e => setCaption(e.target.value)} maxLength={200} placeholder="What's happening? (no last names, please)" /></label>
          <div className="missions" aria-label="Caption ideas">
            {pack.missions.map(m => <button key={m} type="button" className="mission" onClick={() => setCaption(m)}>{m}</button>)}
          </div>
          <TagPicker scouts={roster.data?.scouts || []} den={den} tags={tags} setTags={setTags} />
        </div>
      </Section>

      <div className="snap-bar">
        <button className="btn accent big" disabled={!ready || !!busy} onClick={() => take.current.click()}><Icon name="camera" size={22} />{busy || 'Take a photo'}</button>
        <button className="btn secondary big" disabled={!ready || !!busy} onClick={() => pick.current.click()}><Icon name="image" size={20} />Choose from my phone</button>
        {!ready && <p className="small muted center">Add your name and agree to the sharing rules above to start.</p>}
        {msg && <p className={`form-msg ${msg.bad ? '' : 'good'}`} role={msg.bad ? 'alert' : 'status'}>{msg.text}</p>}
        <p className="small muted center"><Icon name="lock" size={14} /> Location data is removed from every photo before it's sent.</p>
        <input ref={take} type="file" accept="image/*" capture="environment" hidden onChange={e => { onFiles(e.target.files); e.target.value = ''; }} />
        <input ref={pick} type="file" accept="image/*" multiple hidden onChange={e => { onFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {mine.length > 0 && (
        <Section title="Photos you've shared">
          <ul className="mine">
            {mine.map(p => (
              <li key={p.id}>
                {p.thumb && <img src={p.thumb} alt={p.caption || 'Your photo'} />}
                <span className={`status ${p.status}`}>{p.status === 'approved' ? '✓ In the gallery' : p.status === 'pending' ? 'Waiting for a leader' : p.status === 'failed' ? 'Didn\'t send' : 'Sent'}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function TagPicker({ scouts, den, tags, setTags, label = 'Scouts in this photo' }) {
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const shown = useMemo(() => {
    let s = scouts;
    if (q.trim()) s = s.filter(x => x.name.toLowerCase().includes(q.trim().toLowerCase()));
    else if (den && !all && den !== 'Leaders & families') s = s.filter(x => x.den === den || tags.includes(x.id));
    return s;
  }, [scouts, q, den, all, tags]);
  const toggle = id => setTags(tags.includes(id) ? tags.filter(x => x !== id) : [...tags, id]);
  if (!scouts.length) return <p className="small muted tag-empty"><Icon name="tag" size={15} /> Once families fill out photo permission, you can tag scouts here so leaders can double-check.</p>;
  return (
    <div className="tagger">
      <div className="tagger-head"><span className="field-label">{label}</span>{tags.length > 0 && <span className="count-pill">{tags.length} tagged</span>}</div>
      <p className="small muted">Helps leaders check each family's photo choice. Names stay private to leaders.</p>
      {scouts.length > 12 && <input className="tag-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Find a scout" aria-label="Find a scout" />}
      <div className="tag-chips">
        {shown.map(s => <button key={s.id} type="button" className={`chip ${tags.includes(s.id) ? 'on' : ''}`} aria-pressed={tags.includes(s.id)} onClick={() => toggle(s.id)}>{tags.includes(s.id) && <Icon name="check" size={14} />}{s.name}{s.den && <span className="chip-sub">{s.den}</span>}</button>)}
      </div>
      {den && !all && !q && shown.length < scouts.length && <button type="button" className="link-btn small" onClick={() => setAll(true)}>Show scouts from every den</button>}
    </div>
  );
}
