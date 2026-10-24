/**
 * Pack settings — the one file to edit.
 *
 * Secrets are NOT kept here. Set these in Netlify → Site configuration →
 * Environment variables:
 *   PACK_CODE        the code families type to open the app (share it at a pack meeting)
 *   LEADER_PASSCODE  the passcode for the leader tools (#/leaders)
 */
const pack = {
  id: 'pack6-tlh',                       // storage name; change only for a brand-new app
  unit: 'Pack 6',
  appName: 'Pack 6 Photo Trail',
  shortName: 'Photo Trail',
  place: 'Tallahassee, Florida',
  tagline: 'Every adventure, every scout, all in one place.',
  contactEmail: '',                      // optional: shown on the permission page, e.g. 'cubmaster@example.org'
  year: '2026–27',

  colors: {
    primary: '#0B3B8C',                  // pack blue
    primaryDark: '#072A66',
    accent: '#F5B81C',                   // pack gold
    accentInk: '#2A1E00',
  },

  dens: ['Lions', 'Tigers', 'Wolves', 'Bears', 'Webelos', 'Arrow of Light', 'Leaders & families'],

  // Starting albums. Leaders can add more from the leader tools.
  albums: [
    { id: 'meetings', title: 'Pack meetings', emoji: '🏕️' },
    { id: 'den', title: 'Den adventures', emoji: '🧭' },
    { id: 'campout', title: 'Campouts', emoji: '🔥' },
    { id: 'derby', title: 'Pinewood Derby', emoji: '🏁' },
    { id: 'service', title: 'Service projects', emoji: '🤝' },
    { id: 'banquet', title: 'Blue & Gold', emoji: '🏅' },
    { id: 'fun', title: 'Just for fun', emoji: '📸' },
  ],

  // Tap-to-use ideas on the camera screen.
  missions: [
    'Our whole den',
    'Action shot!',
    'Best campfire moment',
    'Building something',
    'Helping out',
    'Silly faces',
    'Nature find',
    'Earned it!',
  ],

  photos: {
    requireApproval: true,               // leaders approve every photo before families see it
    maxPerUpload: 10,
  },

  // What the person sharing a photo agrees to.
  shareRules: [
    'I\'m a {unit} parent, guardian or leader, 18 or older.',
    'I took this photo or have permission to share it.',
    'I won\'t put full names, schools, addresses or other personal details in captions.',
    'Leaders review every photo before families can see it and may remove any photo.',
    '{unit} may post a photo on its public pages only if every scout in it has public permission.',
  ],

  // The family permission choices (one per scout).
  consentLevels: [
    { id: 'public', label: 'Yes, share it', short: 'Public OK',
      text: 'My scout can appear in photos in this private family gallery and on {unit}\'s public pages, like our website or Facebook page. A scout\'s full name, school or address is never posted with a photo.' },
    { id: 'pack', label: 'Pack families only', short: 'Pack only',
      text: 'My scout can appear in photos in this private family gallery, which only {unit} families can open with the pack code. Please don\'t post photos of my scout publicly.' },
    { id: 'none', label: 'No photos, please', short: 'No photos',
      text: 'Please don\'t share photos of my scout. Leaders will hide any photo my scout is in.' },
  ],

  consentTerms: [
    'I\'m the parent or legal guardian of the scout(s) listed.',
    'My choices apply to photos taken at {unit} meetings, outings and events for the {year} scouting year.',
    'I can change or withdraw my choices at any time in this app or by telling a leader. Changes apply to photos shared after that.',
    'No one is paid for photos, and photo choices never affect a scout\'s participation.',
  ],
};

export default pack;
