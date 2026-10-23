// Set mínimo de íconos de línea, sin dependencias externas.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icon = {
  home: (p) => <svg {...base} {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 001 1h3v-7h6v7h3a1 1 0 001-1V10" /></svg>,
  box: (p) => <svg {...base} {...p}><path d="M21 7.5L12 3 3 7.5l9 4.5 9-4.5z" /><path d="M3 7.5v9L12 21l9-4.5v-9" /><path d="M12 12v9" /></svg>,
  wallet: (p) => <svg {...base} {...p}><path d="M3 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M16 12h3" /></svg>,
  truck: (p) => <svg {...base} {...p}><path d="M2 8h11v8H2z" /><path d="M13 11h4l4 3v2h-8z" /><circle cx="6.5" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" /></svg>,
  search: (p) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  plus: (p) => <svg {...base} strokeWidth={2.3} {...p}><path d="M12 5v14M5 12h14" /></svg>,
  edit: (p) => <svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>,
  trash: (p) => <svg {...base} {...p}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></svg>,
  alert: (p) => <svg {...base} {...p}><path d="M12 3l10 18H2z" /><path d="M12 9v5" /><path d="M12 17h.01" /></svg>,
  check: (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.3 2.3 4.7-5" /></svg>,
  x: (p) => <svg {...base} {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>,
  chevronLeft: (p) => <svg {...base} {...p}><path d="M15 6l-6 6 6 6" /></svg>,
  chevronRight: (p) => <svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>,
  up: (p) => <svg {...base} strokeWidth={2.2} {...p}><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></svg>,
  down: (p) => <svg {...base} strokeWidth={2.2} {...p}><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></svg>,
  logout: (p) => <svg {...base} {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>,
  eye: (p) => <svg {...base} {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: (p) => <svg {...base} {...p}><path d="M17.9 17.9A10.4 10.4 0 0112 19C5.6 19 2 12 2 12a18 18 0 015.1-5.9" /><path d="M9.9 5.2A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a18 18 0 01-2.2 3.2" /><path d="M3 3l18 18" /></svg>,
  users: (p) => <svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 4.6a3.5 3.5 0 010 6.8" /><path d="M18.5 14.2A6.5 6.5 0 0121.5 20" /></svg>,
  share: (p) => <svg {...base} {...p}><path d="M12 3v12" /><path d="M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
};
