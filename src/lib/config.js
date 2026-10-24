import pack from '../../pack/pack.js';

export { pack };
export const t = s => String(s ?? '').replaceAll('{unit}', pack.unit).replaceAll('{year}', pack.year).replaceAll('{place}', pack.place);
export const level = id => pack.consentLevels.find(l => l.id === id);

export function applyTheme() {
  const r = document.documentElement.style;
  r.setProperty('--primary', pack.colors.primary);
  r.setProperty('--primary-dark', pack.colors.primaryDark);
  r.setProperty('--accent', pack.colors.accent);
  r.setProperty('--accent-ink', pack.colors.accentInk);
}
