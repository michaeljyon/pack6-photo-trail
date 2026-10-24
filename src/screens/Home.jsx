import { useEffect } from 'react';
import Icon from '../components/Icon.jsx';
import { Section, Empty } from '../components/ui.jsx';
import { useApi, photoUrl, setPackCode } from '../lib/api.js';
import { useLocal, useMe } from '../lib/store.js';
import { pack } from '../lib/config.js';

export default function Home() {
  const [me] = useMe();
  const [family] = useLocal('family', null);
  const [mine, setMine] = useLocal('my-photos', []);
  const albums = useApi('albums');
  const photos = useApi('photos');
  const list = albums.data?.albums || [];
  const recent = (photos.data?.photos || []).slice(0, 9);
  const waiting = mine.filter(p => p.status === 'pending').length;
  useEffect(() => {
    const live = new Set((photos.data?.photos || []).map(p => p.id));
    if (live.size && mine.some(p => p.status === 'pending' && live.has(p.id))) setMine(m => m.map(p => (p.status === 'pending' && live.has(p.id) ? { ...p, status: 'approved' } : p)));
  }, [photos.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const first = me.name.trim().split(/\s+/)[0];

  return (
    <div className="content home">
      <section className="hero">
        <div className="hero-stars" aria-hidden="true"><span /><span /><span /><span /></div>
        <p className="hero-kicker">{pack.unit} · {pack.place}</p>
        <h1>{first ? `Hey ${first}!` : 'Hey, Pack 6!'} <span aria-hidden="true">👋</span></h1>
        <p className="hero-sub">Snap the fun, share it with pack families, and relive every adventure.</p>
        <div className="hero-actions">
          <a className="btn accent big" href="#/snap"><Icon name="camera" size={22} />Snap a photo</a>
          <a className="btn ghost-light" href="#/gallery"><Icon name="grid" size={20} />Gallery</a>
        </div>
      </section>

      {family ? (
        <a className="perm-card ok" href="#/permission">
          <span className="perm-ico"><Icon name="shield" size={24} /></span>
          <span className="perm-main"><b>Photo permission on file</b><span>{family.scouts.map(s => s.first).join(', ')} · tap to review or change</span></span>
          <Icon name="chevronR" />
        </a>
      ) : (
        <a className="perm-card" href="#/permission">
          <span className="perm-ico"><Icon name="shield" size={24} /></span>
          <span className="perm-main"><b>Parents: set your scout's photo permission</b><span>Takes a minute. You choose who can see photos of your scout.</span></span>
          <Icon name="chevronR" />
        </a>
      )}

      {waiting > 0 && <p className="note-pill"><Icon name="clock" size={16} /> {waiting} of your photo{waiting > 1 ? 's are' : ' is'} waiting for a leader to approve.</p>}

      <Section title="Albums" action={<a className="link-btn" href="#/gallery">See all</a>}>
        {albums.error && !list.length ? <Empty icon="alert" title="Couldn't load albums">{albums.error.message}</Empty> : (
          <ul className="albums">
            {(list.length ? list : pack.albums).map(a => (
              <li key={a.id}>
                <a href={`#/gallery?album=${a.id}`} className="album-card">
                  {a.cover ? <img src={photoUrl(a.cover, true)} alt="" loading="lazy" /> : <span className="album-emoji" aria-hidden="true">{a.emoji}</span>}
                  <span className="album-label"><span className="album-title">{a.cover && <span aria-hidden="true">{a.emoji} </span>}{a.title}</span><span className="album-count">{a.count ? `${a.count} photo${a.count > 1 ? 's' : ''}` : 'No photos yet'}</span></span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Fresh from the trail" action={recent.length > 0 && <a className="link-btn" href="#/slideshow">Slideshow <Icon name="play" size={14} /></a>}>
        {photos.loading && !photos.data ? <p className="muted">Loading photos…</p>
          : recent.length === 0 ? <Empty icon="camera" title="No photos yet" action={<a className="btn small" href="#/snap">Share the first one</a>}>Approved photos show up here.</Empty>
          : <ul className="strip">{recent.map(p => <li key={p.id}><a href={`#/gallery?photo=${p.id}`}><img src={photoUrl(p.id, true)} alt={p.caption || 'Pack photo'} loading="lazy" /></a></li>)}</ul>}
      </Section>

      <footer className="home-foot">
        <p><Icon name="lock" size={15} /> Only {pack.unit} families with the pack code can see these photos. Location data is removed from every photo before it's sent.</p>
        <p className="foot-links">
          <a href="#/leaders">Leader tools</a>
          <button className="link-btn" onClick={() => { if (confirm('Sign out of the app on this phone? You\'ll need the pack code to get back in.')) { setPackCode(''); location.hash = '#/'; } }}>Sign out</button>
        </p>
      </footer>
    </div>
  );
}
