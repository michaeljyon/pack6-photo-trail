import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Badge } from '../components/ui.jsx';
import { api, setPackCode } from '../lib/api.js';
import { pack } from '../lib/config.js';

// First screen: the pack code keeps the photos for pack families only.
export default function Gate() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function join(e) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setBusy(true); setMsg('');
    try { await api('join', { method: 'POST', body: { code: c } }); setPackCode(c); location.hash = '#/'; }
    catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="gate">
      <div className="gate-sky" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <div className="gate-card">
        <Badge size={148} className="gate-badge" />
        <h1>{pack.appName}</h1>
        <p className="gate-tag">{pack.tagline}</p>
        <form onSubmit={join} className="gate-form">
          <label className="field"><span>Pack code</span>
            <input value={code} onChange={e => setCode(e.target.value)} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck="false" placeholder="From your den leader" enterKeyHint="go" />
          </label>
          {msg && <p className="form-msg" role="alert">{msg}</p>}
          <button className="btn accent big" disabled={busy || !code.trim()}>{busy ? 'Checking…' : <>Open the trail <Icon name="chevronR" size={20} /></>}</button>
        </form>
        <p className="gate-note"><Icon name="lock" size={16} /> Private to {pack.unit} families · {pack.place}</p>
      </div>
    </div>
  );
}
