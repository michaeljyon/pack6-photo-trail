import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { PageHead, Section, Empty, Sheet } from '../components/ui.jsx';
import { api, leaderPhotoUrl } from '../lib/api.js';
import { pack, level } from '../lib/config.js';
import { TagPicker } from './Snap.jsx';

// Leader tools (#/leaders): review photos against family permission,
// see the permission roster, manage albums, export records.
const TABS = [['review', 'Review', 'image'], ['roster', 'Permissions', 'shield'], ['albums', 'Albums', 'album'], ['data', 'Records', 'download']];

const FLAG = {
  blocked: { cls: 'bad', icon: 'eyeOff', title: 'Has a "No photos" scout', body: 'Hide or delete this photo.' },
  untagged: { cls: 'warn', icon: 'alert', title: 'No scouts tagged', body: 'Check faces against the No-photos list, then tag who\'s in it.' },
  pack: { cls: 'info', icon: 'lock', title: 'Pack families only', body: 'OK for the private gallery. Not for public pages.' },
  public: { cls: 'good', icon: 'globe', title: 'Public OK', body: 'Every tagged scout has public permission.' },
};

export default function Leaders() {
  const [pass, setPass] = useState(() => sessionStorage.getItem('leader-pass') || '');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('review');

  async function login(p = pass) {
    setErr('');
    try { await api('leader/check', { method: 'POST', body: {}, leader: p }); sessionStorage.setItem('leader-pass', p); setOk(true); }
    catch (e) { setOk(false); setErr(e.message); }
  }
  useEffect(() => { if (pass) login(pass); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ok) return (
    <div className="content"><PageHead backTo="home" title="Leader tools" sub="For Pack 6 leaders. Enter the leader passcode." />
      <form className="card narrow" onSubmit={e => { e.preventDefault(); login(pass.trim()); }}>
        <label className="field"><span>Leader passcode</span><input type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck="false" /></label>
        {err && <p className="form-msg" role="alert">{err}</p>}
        <button className="btn">Open leader tools</button>
      </form>
    </div>
  );

  return (
    <div className="content wide">
      <PageHead backTo="home" title="Leader tools">
        <button className="link-btn head-btn" onClick={() => { sessionStorage.removeItem('leader-pass'); setOk(false); setPass(''); }}><Icon name="logout" size={16} /> Sign out</button>
      </PageHead>
      <div className="tabs" role="tablist">
        {TABS.map(([id, l, ic]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}><Icon name={ic} size={18} />{l}</button>)}
      </div>
      {tab === 'review' && <Review pass={pass} />}
      {tab === 'roster' && <Roster pass={pass} />}
      {tab === 'albums' && <Albums pass={pass} />}
      {tab === 'data' && <Records pass={pass} />}
    </div>
  );
}

function useLeader(path, pass) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = () => api(path, { leader: pass }).then(d => { setData(d); setError(null); }).catch(setError);
  useEffect(() => { load(); }, [path, pass]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error, load };
}

function Review({ pass }) {
  const photos = useLeader('leader/photos', pass);
  const stats = useLeader('leader/stats', pass);
  const roster = useLeader('leader/permissions', pass);
  const albums = useLeader('leader/albums', pass);
  const [filter, setFilter] = useState('pending');
  const [tagging, setTagging] = useState(null);
  const [view, setView] = useState(null);
  const [msg, setMsg] = useState('');
  const scouts = (roster.data?.families || []).flatMap(f => f.scouts.map(s => ({ id: s.id, name: `${s.first}${s.lastInitial ? ` ${s.lastInitial}.` : ''}`, den: s.den, level: s.level })));
  const list = (photos.data?.photos || []).filter(p => filter === 'all' || p.status === filter);
  const count = s => (photos.data?.photos || []).filter(p => p.status === s).length;
  const albumList = albums.data?.albums || pack.albums;

  async function update(id, body) {
    setMsg('');
    if (body.status === 'deleted' && !confirm('Delete this photo for good?')) return;
    try { await api(`leader/photos/${id}`, { method: 'POST', body, leader: pass }); photos.load(); stats.load(); }
    catch (e) { setMsg(e.message); }
  }

  const s = stats.data;
  return (
    <>
      {s && (
        <div className="stat-row">
          <div className="stat"><b>{s.pending}</b><span>waiting</span></div>
          <div className="stat"><b>{s.approved}</b><span>in gallery</span></div>
          <div className="stat"><b>{s.scouts}</b><span>scouts with permission</span></div>
          <div className={`stat ${s.levels.none ? 'alert' : ''}`}><b>{s.levels.none}</b><span>no photos</span></div>
        </div>
      )}
      <div className="chip-scroll">
        {[['pending', `Waiting (${count('pending')})`], ['approved', `In gallery (${count('approved')})`], ['hidden', `Hidden (${count('hidden')})`], ['all', 'All']].map(([id, l]) => <button key={id} className={`chip ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>{l}</button>)}
      </div>
      {msg && <p className="form-msg" role="alert">{msg}</p>}
      {photos.error ? <Empty icon="alert" title="Couldn't load photos">{photos.error.message}</Empty>
        : !photos.data ? <p className="muted">Loading…</p>
        : list.length === 0 ? <Empty icon="check" title={filter === 'pending' ? 'All caught up!' : 'Nothing here'}>{filter === 'pending' ? 'No photos waiting for review.' : ''}</Empty>
        : (
          <ul className="review-list">
            {list.map(p => {
              const f = FLAG[p.check.flag];
              const a = albumList.find(x => x.id === p.album);
              return (
                <li key={p.id} className="review card">
                  <button className="review-img" onClick={() => setView(p)} aria-label="View full size"><img src={leaderPhotoUrl(p.id, pass, true)} alt="" loading="lazy" /><span className={`st st-${p.status}`}>{p.status === 'pending' ? 'Waiting' : p.status === 'approved' ? 'In gallery' : 'Hidden'}</span></button>
                  <div className="review-body">
                    <div className={`flag ${f.cls}`}><Icon name={f.icon} size={18} /><span><b>{f.title}</b>{f.body}</span></div>
                    {p.check.tagged.length > 0 && (
                      <p className="tagged">{p.check.tagged.map(t => <span key={t.id} className={`lvl lvl-${t.level}`}>{t.name} · {level(t.level)?.short}</span>)}</p>
                    )}
                    <p className="small"><b>{p.name}</b> <span className="muted">({p.role})</span>{p.caption && <> · “{p.caption}”</>}</p>
                    <p className="small muted">{a ? `${a.emoji} ${a.title}` : p.album}{p.den && ` · ${p.den}`} · {new Date(p.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    <div className="btn-row tight">
                      {p.status !== 'approved' && <button className="btn small" disabled={p.check.flag === 'blocked'} onClick={() => update(p.id, { status: 'approved' })}><Icon name="check" size={16} />Approve</button>}
                      {p.status !== 'hidden' && <button className="btn small secondary" onClick={() => update(p.id, { status: 'hidden' })}><Icon name="eyeOff" size={16} />Hide</button>}
                      <button className="btn small secondary" onClick={() => setTagging({ ...p, tags: p.scouts || [] })}><Icon name="tag" size={16} />Tag</button>
                      <button className={`btn small ${p.public ? 'accent' : 'secondary'}`} disabled={!p.public && p.check.flag !== 'public'} onClick={() => update(p.id, { public: !p.public })} title="Mark OK for the pack's public pages"><Icon name="globe" size={16} />{p.public ? 'Public ✓' : 'OK for public'}</button>
                      <select className="mini-select" value={p.album} onChange={e => update(p.id, { album: e.target.value })} aria-label="Move to album">
                        {albumList.map(x => <option key={x.id} value={x.id}>{x.emoji} {x.title}</option>)}
                      </select>
                      <button className="link-btn small danger" onClick={() => update(p.id, { status: 'deleted' })}><Icon name="trash" size={15} />Delete</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

      <Sheet open={!!tagging} onClose={() => setTagging(null)} title="Who's in this photo?">
        {tagging && <>
          <img className="tag-preview" src={leaderPhotoUrl(tagging.id, pass, true)} alt="" />
          <TagPicker scouts={scouts} den={tagging.den} tags={tagging.tags} setTags={tags => setTagging(t => ({ ...t, tags }))} label="Tag scouts" />
          <div className="btn-row"><button className="btn" onClick={async () => { await update(tagging.id, { scouts: tagging.tags }); setTagging(null); }}>Save tags</button></div>
        </>}
      </Sheet>
      <Sheet open={!!view} onClose={() => setView(null)} title={view?.caption || 'Photo'} wide>
        {view && <img className="full" src={leaderPhotoUrl(view.id, pass)} alt="" />}
      </Sheet>
    </>
  );
}

function Roster({ pass }) {
  const r = useLeader('leader/permissions', pass);
  const fams = r.data?.families || [];
  const scouts = fams.flatMap(f => f.scouts.map(s => ({ ...s, parent: f.parent.name })));
  const none = scouts.filter(s => s.level === 'none');
  async function remove(f) {
    if (!confirm(`Delete the permission record for ${f.parent.name}'s family? They'll need to fill it out again.`)) return;
    await api(`leader/permissions/${f.id}`, { method: 'DELETE', leader: pass }); r.load();
  }
  if (r.error) return <Empty icon="alert" title="Couldn't load">{r.error.message}</Empty>;
  if (!r.data) return <p className="muted">Loading…</p>;
  return (
    <>
      <div className="stat-row">
        {pack.consentLevels.map(l => <div key={l.id} className={`stat lvl-stat lvl-${l.id}`}><b>{scouts.filter(s => s.level === l.id).length}</b><span>{l.short}</span></div>)}
      </div>
      <Section title="No photos, please" className="nophoto">
        {none.length === 0 ? <p className="muted small">No scouts on this list.</p> : (
          <ul className="nophoto-list">{none.map(s => <li key={s.id}><Icon name="eyeOff" size={16} /><b>{s.first} {s.lastInitial && `${s.lastInitial}.`}</b><span className="muted">{s.den}</span></li>)}</ul>
        )}
        <p className="small muted">Check photos against this list at events, especially untagged ones.</p>
      </Section>
      <Section title={`Families (${fams.length})`}>
        {fams.length === 0 ? <Empty icon="shield" title="No permission forms yet">Share the app at your next pack meeting and ask families to tap Permission.</Empty> : (
          <ul className="fam-list">
            {fams.map(f => (
              <li key={f.id} className="card fam">
                <div className="fam-head">
                  <span><b>{f.parent.name}</b>{(f.parent.email || f.parent.phone) && <span className="small muted"><br />{[f.parent.email, f.parent.phone].filter(Boolean).join(' · ')}</span>}</span>
                  <button className="icon-btn" onClick={() => remove(f)} aria-label={`Delete ${f.parent.name}'s record`}><Icon name="trash" size={18} /></button>
                </div>
                <ul className="fam-scouts">{f.scouts.map(s => <li key={s.id}><span>{s.first} {s.lastInitial && `${s.lastInitial}.`} <span className="muted small">{s.den}</span></span><span className={`lvl lvl-${s.level}`}>{level(s.level)?.short}</span></li>)}</ul>
                <p className="small muted">Signed “{f.signature}” · {new Date(f.updated).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{f.history?.length > 1 ? ` · changed ${f.history.length - 1}×` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function Albums({ pass }) {
  const a = useLeader('leader/albums', pass);
  const [title, setTitle] = useState(''), [emoji, setEmoji] = useState('📷'), [date, setDate] = useState('');
  const [msg, setMsg] = useState('');
  async function add(e) {
    e.preventDefault(); setMsg('');
    try { await api('leader/albums', { method: 'POST', body: { title, emoji, date }, leader: pass }); setTitle(''); setDate(''); a.load(); }
    catch (err) { setMsg(err.message); }
  }
  async function del(x) {
    if (!confirm(`Delete the album “${x.title}”?`)) return;
    try { await api(`leader/albums/${x.id}`, { method: 'DELETE', leader: pass }); a.load(); } catch (err) { setMsg(err.message); }
  }
  return (
    <>
      <Section title="Add an album">
        <form className="card album-form" onSubmit={add}>
          <div className="emoji-pick" role="radiogroup" aria-label="Album icon">
            {['📷', '🏕️', '🔥', '🏁', '🎣', '🚀', '🌲', '🎃', '🎄', '🍿', '⚾', '🧪', '🛶', '🎉'].map(x => <button type="button" key={x} role="radio" aria-checked={emoji === x} className={emoji === x ? 'on' : ''} onClick={() => setEmoji(x)}>{x}</button>)}
          </div>
          <div className="two-col">
            <label className="field"><span>Album name</span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fall Campout 2026" maxLength={60} /></label>
            <label className="field"><span>Date <i className="opt">optional</i></span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          </div>
          {msg && <p className="form-msg" role="alert">{msg}</p>}
          <button className="btn" disabled={!title.trim()}><Icon name="plus" size={18} />Add album</button>
        </form>
      </Section>
      <Section title="Albums">
        <ul className="album-rows">
          {(a.data?.albums || []).map(x => (
            <li key={x.id} className="card"><span className="album-row-emoji">{x.emoji}</span><span className="grow"><b>{x.title}</b><br /><span className="small muted">{x.count} photo{x.count === 1 ? '' : 's'}{x.date ? ` · ${new Date(`${x.date}T12:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}{x.builtIn ? ' · built in' : ''}</span></span>
              {!x.builtIn && <button className="icon-btn" onClick={() => del(x)} aria-label={`Delete ${x.title}`}><Icon name="trash" size={18} /></button>}</li>
          ))}
        </ul>
        <p className="small muted">Built-in albums live in <code>pack/pack.js</code>.</p>
      </Section>
    </>
  );
}

function Records({ pass }) {
  const [msg, setMsg] = useState('');
  async function download(kind) {
    setMsg('');
    try {
      const res = await fetch(`/api/leader/export/${kind}`, { headers: { 'x-leader-passcode': pass } });
      if (!res.ok) throw new Error('Export failed.');
      const u = URL.createObjectURL(await res.blob());
      const l = document.createElement('a'); l.href = u; l.download = `${pack.id}-${kind}-${new Date().toISOString().slice(0, 10)}.csv`; l.click();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
    } catch (e) { setMsg(e.message); }
  }
  return (
    <Section title="Download records">
      <div className="card">
        <p>Keep a copy of family permission with your pack records. Spreadsheets open in Excel, Numbers or Google Sheets.</p>
        <div className="btn-row">
          <button className="btn" onClick={() => download('permissions')}><Icon name="shield" size={18} />Photo permission (CSV)</button>
          <button className="btn secondary" onClick={() => download('photos')}><Icon name="image" size={18} />Photo log (CSV)</button>
        </div>
        {msg && <p className="form-msg" role="alert">{msg}</p>}
        <p className="small muted">The photo log shows who shared each photo, its album, the permission check, and whether it's marked OK for public pages.</p>
      </div>
    </Section>
  );
}
