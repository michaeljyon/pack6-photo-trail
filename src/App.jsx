import Icon from './components/Icon.jsx';
import { Badge } from './components/ui.jsx';
import { useRoute } from './lib/router.js';
import { useLocal } from './lib/store.js';
import { pack } from './lib/config.js';

import Gate from './screens/Gate.jsx';
import Home from './screens/Home.jsx';
import Snap from './screens/Snap.jsx';
import Gallery from './screens/Gallery.jsx';
import Permission from './screens/Permission.jsx';
import Leaders from './screens/Leaders.jsx';
import Slideshow from './screens/Slideshow.jsx';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'gallery', label: 'Gallery', icon: 'grid' },
  { id: 'snap', label: 'Snap', icon: 'camera', big: true },
  { id: 'slideshow', label: 'Slideshow', icon: 'play' },
  { id: 'permission', label: 'Permission', icon: 'shield' },
];
const SCREENS = { home: Home, snap: Snap, gallery: Gallery, permission: Permission, leaders: Leaders, slideshow: Slideshow };

export default function App() {
  const route = useRoute();
  const [code] = useLocal('pack-code', '');
  const Screen = SCREENS[route.name] || Home;

  if (route.name === 'slideshow' && code) return <Slideshow route={route} />;
  if (!code && route.name !== 'leaders') return <Gate />;

  return (
    <div className="app">
      <header className="app-header">
        <a className="header-brand" href="#/" aria-label={`${pack.appName} home`}>
          <Badge size={42} />
          <span className="header-text"><span className="header-unit">{pack.unit}</span><span className="header-app">Photo Trail</span></span>
        </a>
        <a className="icon-btn on-dark" href="#/snap" aria-label="Share a photo"><Icon name="camera" /></a>
      </header>
      <main className="app-main" id="main"><Screen route={route} /></main>
      {route.name !== 'leaders' && code && (
        <nav className="tabbar" aria-label="Main">
          {TABS.map(tab => {
            const active = route.name === tab.id;
            return (
              <a key={tab.id} href={`#/${tab.id === 'home' ? '' : tab.id}`} className={`${active ? 'active' : ''} ${tab.big ? 'big' : ''}`} aria-current={active ? 'page' : undefined}>
                <span className="tab-ico"><Icon name={tab.icon} size={tab.big ? 26 : 22} /></span>
                <span>{tab.label}</span>
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}
