// Stroke icons (24px grid). Decorative unless a label is given.
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  people: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M18 14a6 6 0 0 1 4 6v1',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5v.5',
  bell: 'M6 17V11a6 6 0 1 1 12 0v6l2 2H4zM10 21h4',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  chevronR: 'm9 5 7 7-7 7',
  chevronL: 'm15 5-7 7 7 7',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z',
  check: 'm5 12 5 5 9-10',
  x: 'M6 6l12 12M18 6 6 18',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2',
  pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  message: 'M4 5h16v11H9l-5 4z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5a1 1 0 1 0 0-.01',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  gift: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7S10.5 3 8 3.5 7.5 7 12 7zM12 7s1.5-4 4-3.5S16.5 7 12 7z',
  heart: 'M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  ticket: 'M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3zM14 4v16',
  share: 'M12 3v12M7 8l5-5 5 5M5 13v7h14v-7',
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  download: 'M12 3v12M7 10l5 5 5-5M5 20h14',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  plus: 'M12 5v14M5 12h14',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6zM9 12l2 2 4-4',
  play: 'M7 4v16l13-8z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  album: 'M3 7h18v13H3zM6 4h12M8 15l3-3 3 3 2-2 3 3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  alert: 'M12 3 2 20h20zM12 10v4M12 17v.5',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20',
  eyeOff: 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3 3.5M6.6 6.6C4 8.4 3 12 3 12s4 6 9 6a9 9 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2',
};

export default function Icon({ name, size = 22, filled = false, label, className = '', strokeWidth = 1.9 }) {
  return (
    <svg className={`ico ${className}`} width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={P[name] || P.info} />
    </svg>
  );
}
