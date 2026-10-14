// Official NHL Teams, Venues, and League Data

export const NHL_TEAMS = {
  blackhawks: {
    id: 'blackhawks',
    name: 'Chicago Blackhawks',
    shortCode: 'CHI',
    city: 'Chicago',
    primaryColor: '#CF0A2C',
    stadium: 'United Center',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="46" fill="#CF0A2C"/><path d="M50 20 C60 10 75 12 80 25 C75 28 65 24 55 25" fill="#FFD100"/><path d="M55 25 C65 18 80 22 83 35 C76 37 68 32 58 32" fill="#00833E"/><path d="M58 32 C68 28 82 34 82 45 C75 45 68 40 58 40" fill="#FF671B"/><path d="M30 45 C32 35 45 32 52 35 C58 38 60 48 58 55 C54 65 42 68 35 62 C30 58 28 50 30 45 Z" fill="#D39763"/><path d="M35 34 C42 32 50 34 52 38 C48 42 42 45 35 48 C32 45 32 38 35 34 Z" fill="#111111"/><path d="M40 50 L48 50" stroke="#CF0A2C" stroke-width="2.5"/><path d="M40 54 L48 54" stroke="#FFFFFF" stroke-width="2.5"/><path d="M40 58 L48 58" stroke="#00833E" stroke-width="2.5"/><circle cx="45" cy="44" r="1.5" fill="#111111"/></svg>`
  },
  penguins: {
    id: 'penguins',
    name: 'Pittsburgh Penguins',
    shortCode: 'PIT',
    city: 'Pittsburgh',
    primaryColor: '#FCB514',
    stadium: 'PPG Paints Arena',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><polygon points="50,15 88,78 12,78" fill="#FCB514" stroke="#000000" stroke-width="3"/><path d="M50 25 C42 25 36 34 36 48 C36 62 42 74 50 74 C58 74 64 62 64 48 C64 34 58 25 50 25 Z" fill="#000000"/><ellipse cx="50" cy="52" rx="9" ry="17" fill="#FFFFFF"/><circle cx="46" cy="33" r="2" fill="#FCB514"/><polygon points="42,35 32,38 42,40" fill="#FCB514"/><line x1="30" y1="65" x2="72" y2="38" stroke="#000000" stroke-width="4"/><line x1="28" y1="65" x2="22" y2="60" stroke="#000000" stroke-width="4"/><path d="M46 72 L42 78 M54 72 L58 78" stroke="#FCB514" stroke-width="3"/></svg>`
  },
  jets: {
    id: 'jets',
    name: 'Winnipeg Jets',
    shortCode: 'WPG',
    city: 'Winnipeg',
    primaryColor: '#041E42',
    stadium: 'Canada Life Centre',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="45" fill="#041E42" stroke="#7C878E" stroke-width="3"/><circle cx="50" cy="50" r="37" fill="#004C97"/><polygon points="50,26 53,42 74,58 72,62 53,52 52,68 58,74 50,72 42,74 48,68 47,52 28,62 26,58 47,42" fill="#FFFFFF"/></svg>`
  },
  wild: {
    id: 'wild',
    name: 'Minnesota Wild',
    shortCode: 'MIN',
    city: 'Minnesota',
    primaryColor: '#154734',
    stadium: 'Xcel Energy Center',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M12 55 C12 30 35 20 60 22 C78 24 90 38 88 56 C86 70 72 80 50 80 C28 80 12 70 12 55 Z" fill="#154734"/><circle cx="70" cy="40" r="6" fill="#DDCBA4"/><polygon points="25,65 30,50 35,65" fill="#A6192E"/><polygon points="38,65 44,45 50,65" fill="#DDCBA4"/><polygon points="52,65 58,48 64,65" fill="#A6192E"/><path d="M22 68 Q50 78 78 68" stroke="#DDCBA4" stroke-width="4" fill="none"/></svg>`
  },
  stars: {
    id: 'stars',
    name: 'Dallas Stars',
    shortCode: 'DAL',
    city: 'Dallas',
    primaryColor: '#006847',
    stadium: 'American Airlines Center',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><polygon points="50,12 61,38 89,38 66,54 75,80 50,64 25,80 34,54 11,38 39,38" fill="#006847" stroke="#8F8F8C" stroke-width="4"/><path d="M42 32 L52 32 C62 32 68 40 68 50 C68 60 62 68 52 68 L42 68 Z M48 40 L48 60 L52 60 C57 60 61 56 61 50 C61 44 57 40 52 40 Z" fill="#FFFFFF"/></svg>`
  },
  avalanche: {
    id: 'avalanche',
    name: 'Colorado Avalanche',
    shortCode: 'COL',
    city: 'Colorado',
    primaryColor: '#6F263D',
    stadium: 'Ball Arena',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><polygon points="50,15 78,78 62,78 50,48 38,78 22,78" fill="#6F263D" stroke="#000000" stroke-width="2"/><path d="M20 72 C35 55 55 45 78 35 C70 45 60 55 45 68 C35 76 25 78 20 72 Z" fill="#236192"/><path d="M28 65 C40 50 60 40 82 32" stroke="#FFFFFF" stroke-width="5" fill="none"/><ellipse cx="80" cy="74" rx="8" ry="4" fill="#111111"/></svg>`
  },
  predators: {
    id: 'predators',
    name: 'Nashville Predators',
    shortCode: 'NSH',
    city: 'Nashville',
    primaryColor: '#FFB81C',
    stadium: 'Bridgestone Arena',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M15 50 C20 30 40 22 65 24 C82 25 88 38 85 52 C82 65 70 75 52 76 C35 77 22 72 15 50 Z" fill="#FFB81C" stroke="#041E42" stroke-width="3"/><polygon points="48,36 58,40 50,44" fill="#041E42"/><polygon points="32,54 36,54 33,72" fill="#FFFFFF" stroke="#041E42" stroke-width="1.5"/></svg>`
  },
  knights: {
    id: 'knights',
    name: 'Vegas Golden Knights',
    shortCode: 'VGK',
    city: 'Las Vegas',
    primaryColor: '#B4975A',
    stadium: 'T-Mobile Arena',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><polygon points="50,10 88,24 78,82 50,96 22,82 12,24" fill="#333F48" stroke="#B4975A" stroke-width="4"/><polygon points="50,26 68,36 62,68 50,80 38,68 32,36" fill="#B4975A"/><polygon points="50,42 60,48 56,66 50,72 44,66 40,48" fill="#111111"/></svg>`
  },
  mammoth: {
    id: 'mammoth',
    name: 'Utah Mammoth',
    shortCode: 'UTA',
    city: 'Salt Lake City',
    primaryColor: '#010101',
    stadium: 'Delta Center',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="45" fill="#010101" stroke="#79BDE8" stroke-width="4"/><polygon points="25,65 42,35 55,65" fill="#79BDE8"/><polygon points="45,65 60,30 75,65" fill="#FFFFFF"/><text x="50" y="78" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">UTAH</text></svg>`
  },
  mapleleafs: {
    id: 'mapleleafs',
    name: 'Toronto Maple Leafs',
    shortCode: 'TOR',
    city: 'Toronto',
    primaryColor: '#00205B',
    stadium: 'Scotiabank Arena',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M50 10 L54 22 L62 20 L62 28 L72 26 L70 36 L82 38 L76 48 L86 54 L78 62 L82 70 L68 70 L64 78 L54 74 L52 88 L48 88 L46 74 L36 78 L32 70 L18 70 L22 62 L14 54 L24 48 L18 38 L30 36 L28 26 L38 28 L38 20 L46 22 Z" fill="#00205B"/></svg>`
  },
  oilers: {
    id: 'oilers',
    name: 'Edmonton Oilers',
    shortCode: 'EDM',
    city: 'Edmonton',
    primaryColor: '#041E42',
    stadium: 'Rogers Place',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="45" fill="#041E42" stroke="#FF4C00" stroke-width="4"/><circle cx="50" cy="50" r="36" fill="#FFFFFF"/><text x="50" y="58" font-size="16" font-weight="900" fill="#041E42" text-anchor="middle">OILERS</text></svg>`
  },
  flames: {
    id: 'flames',
    name: 'Calgary Flames',
    shortCode: 'CGY',
    city: 'Calgary',
    primaryColor: '#C8102E',
    stadium: 'Scotiabank Saddledome',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="45" fill="#C8102E" stroke="#F1BE48" stroke-width="4"/><text x="50" y="65" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle">C</text></svg>`
  },
  bruins: {
    id: 'bruins',
    name: 'Boston Bruins',
    shortCode: 'BOS',
    city: 'Boston',
    primaryColor: '#FFB81C',
    stadium: 'TD Garden',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="45" fill="#000000" stroke="#FFB81C" stroke-width="5"/><circle cx="50" cy="50" r="35" fill="#FFB81C"/><text x="50" y="66" font-size="48" font-weight="900" fill="#000000" text-anchor="middle">B</text></svg>`
  },
  canadiens: {
    id: 'canadiens',
    name: 'Montreal Canadiens',
    shortCode: 'MTL',
    city: 'Montreal',
    primaryColor: '#AF1E2D',
    stadium: 'Bell Centre',
    crestSvg: `<svg viewBox="0 0 100 100" class="w-full h-full"><ellipse cx="50" cy="50" rx="46" ry="34" fill="#AF1E2D" stroke="#192168" stroke-width="5"/><text x="50" y="64" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle">C</text></svg>`
  }
};

// Default Live Match State
export const DEFAULT_MATCH_STATE = {
  id: 'live-match-1',
  home: {
    id: 'blackhawks',
    name: 'Chicago Blackhawks',
    score: 5,
    shots: 32
  },
  away: {
    id: 'penguins',
    name: 'Pittsburgh Penguins',
    score: 3,
    shots: 28
  },
  period: 'FT',
  periodScores: {
    p1: { home: 2, away: 1 },
    p2: { home: 1, away: 1 },
    p3: { home: 2, away: 1 },
    ot: { home: 0, away: 0 }
  },
  clock: {
    running: false,
    remainingSeconds: 1200,
    defaultPeriodSeconds: 1200,
    lastUpdatedAt: Date.now()
  },
  venue: 'United Center',
  date: 'Wed, Oct 14, 2026',
  dateTime: 'Wed, Oct 14, 2026 05:30',
  referee: 'Furlatt E.',
  league: 'NHL',
  country: 'USA',
  events: [
    { id: 1, time: '05:12', period: 'P1', team: 'home', scorer: 'C. Bedard', assist: 'N. Foligno', text: 'Goal! Chicago Blackhawks (1 - 0)' },
    { id: 2, time: '12:30', period: 'P1', team: 'away', scorer: 'S. Crosby', assist: 'E. Malkin', text: 'Goal! Pittsburgh Penguins (1 - 1)' },
    { id: 3, time: '17:44', period: 'P1', team: 'home', scorer: 'J. Dickinson', assist: 'S. Jones', text: 'Goal! Chicago Blackhawks (2 - 1)' },
    { id: 4, time: '28:15', period: 'P2', team: 'away', scorer: 'B. Rust', assist: 'E. Karlsson', text: 'Goal! Pittsburgh Penguins (2 - 2)' },
    { id: 5, time: '36:40', period: 'P2', team: 'home', scorer: 'T. Hall', assist: 'C. Bedard', text: 'Goal! Chicago Blackhawks (3 - 2)' },
    { id: 6, time: '44:22', period: 'P3', team: 'home', scorer: 'C. Bedard', assist: 'T. Teravainen', text: 'Goal! Chicago Blackhawks (4 - 2)' },
    { id: 7, time: '52:10', period: 'P3', team: 'away', scorer: 'E. Malkin', assist: 'K. Letang', text: 'Goal! Pittsburgh Penguins (4 - 3)' },
    { id: 8, time: '59:18', period: 'P3', team: 'home', scorer: 'N. Foligno', assist: 'Empty Net', text: 'Goal! Chicago Blackhawks (5 - 3)' }
  ]
};

// Complete Default Matches List for Dynamic Management
export const DEFAULT_MATCHES_LIST = [
  DEFAULT_MATCH_STATE,
  {
    id: 'match-jets-wild',
    home: { id: 'jets', name: 'Winnipeg Jets', score: 5, shots: 30 },
    away: { id: 'wild', name: 'Minnesota Wild', score: 2, shots: 22 },
    period: 'FT',
    periodScores: { p1: { home: 2, away: 0 }, p2: { home: 2, away: 1 }, p3: { home: 1, away: 1 }, ot: { home: 0, away: 0 } },
    clock: { running: false, remainingSeconds: 1200, defaultPeriodSeconds: 1200, lastUpdatedAt: Date.now() },
    venue: 'Canada Life Centre',
    date: 'Wed, Oct 14, 2026',
    dateTime: 'Wed, Oct 14, 2026 05:00',
    referee: 'Roach J.',
    league: 'NHL',
    country: 'USA',
    status: 'FT',
    statusBadge: 'FT'
  },
  {
    id: 'match-stars-avs',
    home: { id: 'stars', name: 'Dallas Stars', score: 2, shots: 26 },
    away: { id: 'avalanche', name: 'Colorado Avalanche', score: 3, shots: 35 },
    period: 'FT',
    periodScores: { p1: { home: 1, away: 1 }, p2: { home: 0, away: 1 }, p3: { home: 1, away: 1 }, ot: { home: 0, away: 0 } },
    clock: { running: false, remainingSeconds: 1200, defaultPeriodSeconds: 1200, lastUpdatedAt: Date.now() },
    venue: 'American Airlines Center',
    date: 'Wed, Oct 14, 2026',
    dateTime: 'Wed, Oct 14, 2026 06:30',
    referee: 'McCauley W.',
    league: 'NHL',
    country: 'USA',
    status: 'FT',
    statusBadge: 'FT'
  },
  {
    id: 'match-preds-knights',
    home: { id: 'predators', name: 'Nashville Predators', score: 2, shots: 24 },
    away: { id: 'knights', name: 'Vegas Golden Knights', score: 5, shots: 38 },
    period: 'FT',
    periodScores: { p1: { home: 0, away: 2 }, p2: { home: 1, away: 2 }, p3: { home: 1, away: 1 }, ot: { home: 0, away: 0 } },
    clock: { running: false, remainingSeconds: 1200, defaultPeriodSeconds: 1200, lastUpdatedAt: Date.now() },
    venue: 'Bridgestone Arena',
    date: 'Wed, Oct 14, 2026',
    dateTime: 'Wed, Oct 14, 2026 07:00',
    referee: 'Sutherland K.',
    league: 'NHL',
    country: 'USA',
    status: 'FT',
    statusBadge: 'FT'
  },
  {
    id: 'match-mammoth-leafs',
    home: { id: 'mammoth', name: 'Utah Mammoth', score: 5, shots: 31 },
    away: { id: 'mapleleafs', name: 'Toronto Maple Leafs', score: 4, shots: 29 },
    period: 'FT',
    periodScores: { p1: { home: 2, away: 1 }, p2: { home: 2, away: 2 }, p3: { home: 1, away: 1 }, ot: { home: 0, away: 0 } },
    clock: { running: false, remainingSeconds: 1200, defaultPeriodSeconds: 1200, lastUpdatedAt: Date.now() },
    venue: 'Delta Center',
    date: 'Wed, Oct 14, 2026',
    dateTime: 'Wed, Oct 14, 2026 08:00',
    referee: 'Lee C.',
    league: 'NHL',
    country: 'USA',
    status: 'FT',
    statusBadge: 'FT'
  },
  {
    id: 'match-oilers-flames',
    home: { id: 'oilers', name: 'Edmonton Oilers', score: 0, shots: 0 },
    away: { id: 'flames', name: 'Calgary Flames', score: 0, shots: 0 },
    period: 'UPCOMING',
    periodScores: { p1: { home: 0, away: 0 }, p2: { home: 0, away: 0 }, p3: { home: 0, away: 0 }, ot: { home: 0, away: 0 } },
    clock: { running: false, remainingSeconds: 1200, defaultPeriodSeconds: 1200, lastUpdatedAt: Date.now() },
    venue: 'Rogers Place',
    date: 'Thu, Oct 15, 2026',
    dateTime: 'Thu, Oct 15, 2026 19:00',
    referee: 'Rank G.',
    league: 'NHL',
    country: 'USA',
    status: 'Upcoming',
    statusBadge: '19:00'
  },
  {
    id: 'match-bruins-habs',
    home: { id: 'bruins', name: 'Boston Bruins', score: 0, shots: 0 },
    away: { id: 'canadiens', name: 'Montreal Canadiens', score: 0, shots: 0 },
    period: 'UPCOMING',
    periodScores: { p1: { home: 0, away: 0 }, p2: { home: 0, away: 0 }, p3: { home: 0, away: 0 }, ot: { home: 0, away: 0 } },
    clock: { running: false, remainingSeconds: 1200, defaultPeriodSeconds: 1200, lastUpdatedAt: Date.now() },
    venue: 'TD Garden',
    date: 'Thu, Oct 15, 2026',
    dateTime: 'Thu, Oct 15, 2026 19:30',
    referee: 'St. Laurent F.',
    league: 'NHL',
    country: 'USA',
    status: 'Upcoming',
    statusBadge: '19:30'
  }
];

// Fixtures for Today (Screenshot 1 Layout)
export const NHL_LEAGUE_CARDS_TODAY = [
  {
    country: 'USA',
    league: 'NHL',
    fixtures: [
      {
        id: 'live-match-1',
        isLiveSync: true,
        homeTeam: NHL_TEAMS.blackhawks,
        awayTeam: NHL_TEAMS.penguins,
        status: 'FT',
        statusBadge: 'FT',
        homeScore: 5,
        awayScore: 3,
        venue: 'United Center',
        date: 'Wed, Oct 14, 2026 05:30',
        referee: 'Furlatt E.'
      },
      {
        id: 'match-jets-wild',
        isLiveSync: false,
        homeTeam: NHL_TEAMS.jets,
        awayTeam: NHL_TEAMS.wild,
        status: 'FT',
        statusBadge: 'FT',
        homeScore: 5,
        awayScore: 2,
        venue: 'Canada Life Centre',
        date: 'Wed, Oct 14, 2026',
        referee: 'Roach J.'
      }
    ]
  },
  {
    country: 'USA',
    league: 'NHL',
    fixtures: [
      {
        id: 'match-stars-avs',
        isLiveSync: false,
        homeTeam: NHL_TEAMS.stars,
        awayTeam: NHL_TEAMS.avalanche,
        status: 'FT',
        statusBadge: 'FT',
        homeScore: 2,
        awayScore: 3,
        venue: 'American Airlines Center',
        date: 'Wed, Oct 14, 2026',
        referee: 'McCauley W.'
      },
      {
        id: 'match-preds-knights',
        isLiveSync: false,
        homeTeam: NHL_TEAMS.predators,
        awayTeam: NHL_TEAMS.knights,
        status: 'FT',
        statusBadge: 'FT',
        homeScore: 2,
        awayScore: 5,
        venue: 'Bridgestone Arena',
        date: 'Wed, Oct 14, 2026',
        referee: 'Sutherland K.'
      },
      {
        id: 'match-mammoth-leafs',
        isLiveSync: false,
        homeTeam: NHL_TEAMS.mammoth,
        awayTeam: NHL_TEAMS.mapleleafs,
        status: 'FT',
        statusBadge: 'FT',
        homeScore: 5,
        awayScore: 4,
        venue: 'Delta Center',
        date: 'Wed, Oct 14, 2026',
        referee: 'Lee C.'
      }
    ]
  }
];

// Fixtures for Tomorrow (Upcoming Games)
export const NHL_LEAGUE_CARDS_TOMORROW = [
  {
    country: 'USA',
    league: 'NHL',
    fixtures: [
      {
        id: 'match-oilers-flames',
        isLiveSync: false,
        homeTeam: NHL_TEAMS.oilers,
        awayTeam: NHL_TEAMS.flames,
        status: 'Upcoming',
        statusBadge: '19:00',
        homeScore: '-',
        awayScore: '-',
        venue: 'Rogers Place',
        date: 'Thu, Oct 15, 2026 19:00',
        referee: 'Rank G.'
      },
      {
        id: 'match-bruins-habs',
        isLiveSync: false,
        homeTeam: NHL_TEAMS.bruins,
        awayTeam: NHL_TEAMS.canadiens,
        status: 'Upcoming',
        statusBadge: '19:30',
        homeScore: '-',
        awayScore: '-',
        venue: 'TD Garden',
        date: 'Thu, Oct 15, 2026 19:30',
        referee: 'St. Laurent F.'
      }
    ]
  }
];

// Standings Table Data
export const NHL_STANDINGS = [
  { pos: 1, team: 'Winnipeg Jets', gp: 10, w: 9, l: 1, otl: 0, pts: 18, gf: 44, ga: 24 },
  { pos: 2, team: 'Colorado Avalanche', gp: 10, w: 7, l: 3, otl: 0, pts: 14, gf: 38, ga: 29 },
  { pos: 3, team: 'Dallas Stars', gp: 9, w: 6, l: 3, otl: 0, pts: 12, gf: 31, ga: 22 },
  { pos: 4, team: 'Vegas Golden Knights', gp: 10, w: 6, l: 3, otl: 1, pts: 13, gf: 42, ga: 31 },
  { pos: 5, team: 'Chicago Blackhawks', gp: 10, w: 5, l: 4, otl: 1, pts: 11, gf: 32, ga: 33 },
  { pos: 6, team: 'Pittsburgh Penguins', gp: 10, w: 4, l: 5, otl: 1, pts: 9, gf: 30, ga: 38 },
  { pos: 7, team: 'Minnesota Wild', gp: 9, w: 4, l: 4, otl: 1, pts: 9, gf: 27, ga: 28 },
  { pos: 8, team: 'Nashville Predators', gp: 9, w: 3, l: 5, otl: 1, pts: 7, gf: 23, ga: 34 }
];

export const NHL_LINEUPS = {
  blackhawks: [
    { number: 34, name: 'P. Mrazek', pos: 'G', nationality: 'CZE' },
    { number: 98, name: 'C. Bedard', pos: 'C', nationality: 'CAN' },
    { number: 17, name: 'N. Foligno', pos: 'LW', nationality: 'USA' },
    { number: 86, name: 'T. Teravainen', pos: 'RW', nationality: 'FIN' },
    { number: 4, name: 'S. Jones', pos: 'D', nationality: 'USA' },
    { number: 72, name: 'A. Vlasic', pos: 'D', nationality: 'USA' }
  ],
  penguins: [
    { number: 35, name: 'T. Jarry', pos: 'G', nationality: 'CAN' },
    { number: 87, name: 'S. Crosby', pos: 'C', nationality: 'CAN' },
    { number: 71, name: 'E. Malkin', pos: 'C', nationality: 'RUS' },
    { number: 17, name: 'B. Rust', pos: 'RW', nationality: 'USA' },
    { number: 58, name: 'K. Letang', pos: 'D', nationality: 'CAN' },
    { number: 65, name: 'E. Karlsson', pos: 'D', nationality: 'SWE' }
  ],
  jets: [
    { number: 37, name: 'C. Hellebuyck', pos: 'G', nationality: 'USA' },
    { number: 55, name: 'M. Scheifele', pos: 'C', nationality: 'CAN' },
    { number: 81, name: 'K. Connor', pos: 'LW', nationality: 'USA' },
    { number: 27, name: 'N. Ehlers', pos: 'RW', nationality: 'DEN' },
    { number: 44, name: 'J. Morrissey', pos: 'D', nationality: 'CAN' },
    { number: 4, name: 'N. Pionk', pos: 'D', nationality: 'USA' }
  ],
  wild: [
    { number: 29, name: 'M. Fleury', pos: 'G', nationality: 'CAN' },
    { number: 97, name: 'K. Kaprizov', pos: 'LW', nationality: 'RUS' },
    { number: 14, name: 'J. Eriksson Ek', pos: 'C', nationality: 'SWE' },
    { number: 12, name: 'M. Boldy', pos: 'RW', nationality: 'USA' },
    { number: 7, name: 'B. Faber', pos: 'D', nationality: 'USA' },
    { number: 46, name: 'J. Spurgeon', pos: 'D', nationality: 'CAN' }
  ],
  stars: [
    { number: 29, name: 'J. Oettinger', pos: 'G', nationality: 'USA' },
    { number: 24, name: 'R. Hintz', pos: 'C', nationality: 'FIN' },
    { number: 21, name: 'J. Robertson', pos: 'LW', nationality: 'USA' },
    { number: 53, name: 'W. Johnston', pos: 'C', nationality: 'CAN' },
    { number: 4, name: 'M. Heiskanen', pos: 'D', nationality: 'FIN' },
    { number: 23, name: 'E. Lindell', pos: 'D', nationality: 'FIN' }
  ],
  avalanche: [
    { number: 40, name: 'A. Georgiev', pos: 'G', nationality: 'BUL' },
    { number: 29, name: 'N. MacKinnon', pos: 'C', nationality: 'CAN' },
    { number: 96, name: 'M. Rantanen', pos: 'RW', nationality: 'FIN' },
    { number: 62, name: 'A. Lehkonen', pos: 'LW', nationality: 'FIN' },
    { number: 8, name: 'C. Makar', pos: 'D', nationality: 'CAN' },
    { number: 7, name: 'D. Toews', pos: 'D', nationality: 'CAN' }
  ],
  predators: [
    { number: 74, name: 'J. Saros', pos: 'G', nationality: 'FIN' },
    { number: 9, name: 'F. Forsberg', pos: 'LW', nationality: 'SWE' },
    { number: 91, name: 'S. Stamkos', pos: 'C', nationality: 'CAN' },
    { number: 81, name: 'J. Marchessault', pos: 'RW', nationality: 'CAN' },
    { number: 59, name: 'R. Josi', pos: 'D', nationality: 'SUI' },
    { number: 76, name: 'B. Skjei', pos: 'D', nationality: 'USA' }
  ],
  knights: [
    { number: 33, name: 'A. Hill', pos: 'G', nationality: 'CAN' },
    { number: 9, name: 'J. Eichel', pos: 'C', nationality: 'USA' },
    { number: 61, name: 'M. Stone', pos: 'RW', nationality: 'CAN' },
    { number: 48, name: 'T. Hertl', pos: 'C', nationality: 'CZE' },
    { number: 7, name: 'A. Pietrangelo', pos: 'D', nationality: 'CAN' },
    { number: 27, name: 'S. Theodore', pos: 'D', nationality: 'CAN' }
  ],
  mammoth: [
    { number: 39, name: 'C. Ingram', pos: 'G', nationality: 'CAN' },
    { number: 9, name: 'C. Keller', pos: 'RW', nationality: 'USA' },
    { number: 11, name: 'D. Guenther', pos: 'RW', nationality: 'CAN' },
    { number: 92, name: 'L. Cooley', pos: 'C', nationality: 'USA' },
    { number: 98, name: 'M. Sergachev', pos: 'D', nationality: 'RUS' },
    { number: 50, name: 'S. Durzi', pos: 'D', nationality: 'CAN' }
  ],
  mapleleafs: [
    { number: 60, name: 'J. Woll', pos: 'G', nationality: 'USA' },
    { number: 34, name: 'A. Matthews', pos: 'C', nationality: 'USA' },
    { number: 16, name: 'M. Marner', pos: 'RW', nationality: 'CAN' },
    { number: 88, name: 'W. Nylander', pos: 'RW', nationality: 'SWE' },
    { number: 44, name: 'M. Rielly', pos: 'D', nationality: 'CAN' },
    { number: 8, name: 'C. Tanev', pos: 'D', nationality: 'CAN' }
  ],
  oilers: [
    { number: 74, name: 'S. Skinner', pos: 'G', nationality: 'CAN' },
    { number: 97, name: 'C. McDavid', pos: 'C', nationality: 'CAN' },
    { number: 29, name: 'L. Draisaitl', pos: 'C', nationality: 'GER' },
    { number: 18, name: 'Z. Hyman', pos: 'LW', nationality: 'CAN' },
    { number: 2, name: 'E. Bouchard', pos: 'D', nationality: 'CAN' },
    { number: 14, name: 'M. Ekholm', pos: 'D', nationality: 'SWE' }
  ],
  flames: [
    { number: 32, name: 'D. Wolf', pos: 'G', nationality: 'USA' },
    { number: 91, name: 'N. Kadri', pos: 'C', nationality: 'CAN' },
    { number: 10, name: 'J. Huberdeau', pos: 'LW', nationality: 'CAN' },
    { number: 96, name: 'A. Kuzmenko', pos: 'RW', nationality: 'RUS' },
    { number: 4, name: 'R. Andersson', pos: 'D', nationality: 'SWE' },
    { number: 52, name: 'M. Weegar', pos: 'D', nationality: 'CAN' }
  ],
  bruins: [
    { number: 1, name: 'J. Swayman', pos: 'G', nationality: 'USA' },
    { number: 88, name: 'D. Pastrnak', pos: 'RW', nationality: 'CZE' },
    { number: 63, name: 'B. Marchand', pos: 'LW', nationality: 'CAN' },
    { number: 28, name: 'E. Lindholm', pos: 'C', nationality: 'SWE' },
    { number: 73, name: 'C. McAvoy', pos: 'D', nationality: 'USA' },
    { number: 91, name: 'N. Zadorov', pos: 'D', nationality: 'RUS' }
  ],
  canadiens: [
    { number: 35, name: 'S. Montembeault', pos: 'G', nationality: 'CAN' },
    { number: 14, name: 'N. Suzuki', pos: 'C', nationality: 'CAN' },
    { number: 22, name: 'C. Caufield', pos: 'RW', nationality: 'USA' },
    { number: 20, name: 'J. Slafkovsky', pos: 'LW', nationality: 'SVK' },
    { number: 8, name: 'M. Matheson', pos: 'D', nationality: 'CAN' },
    { number: 21, name: 'K. Guhle', pos: 'D', nationality: 'CAN' }
  ]
};

// Generate an official-style SVG crest for admin-created teams
export function generateTeamCrestSvg(teamName = 'Custom Team', primaryColor = '#1e40af') {
  const cleanName = (teamName || 'Custom Team').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = 'CT';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0][0].toUpperCase();
  }

  // Pick deterministic secondary color
  const colors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2', '#4b5563', '#be123c'];
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  return `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="46" fill="${color}" stroke="#ffffff" stroke-width="3"/><circle cx="50" cy="50" r="39" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/><text x="50" y="58" font-size="28" font-weight="900" font-family="system-ui, sans-serif" fill="#ffffff" text-anchor="middle" letter-spacing="1">${initials}</text></svg>`;
}

// Known NHL / Hockey team suggestions if admin types or selects them
export const KNOWN_HOCKEY_SUGGESTIONS = {
  'red wings': [
    { number: 34, name: 'A. Lyon', pos: 'G', nationality: 'USA' },
    { number: 71, name: 'D. Larkin', pos: 'C', nationality: 'USA' },
    { number: 88, name: 'P. Kane', pos: 'RW', nationality: 'USA' },
    { number: 23, name: 'L. Raymond', pos: 'LW', nationality: 'SWE' },
    { number: 53, name: 'M. Seider', pos: 'D', nationality: 'GER' },
    { number: 8, name: 'B. Chiarot', pos: 'D', nationality: 'CAN' }
  ],
  'detroit': [
    { number: 34, name: 'A. Lyon', pos: 'G', nationality: 'USA' },
    { number: 71, name: 'D. Larkin', pos: 'C', nationality: 'USA' },
    { number: 88, name: 'P. Kane', pos: 'RW', nationality: 'USA' },
    { number: 23, name: 'L. Raymond', pos: 'LW', nationality: 'SWE' },
    { number: 53, name: 'M. Seider', pos: 'D', nationality: 'GER' },
    { number: 8, name: 'B. Chiarot', pos: 'D', nationality: 'CAN' }
  ],
  'kraken': [
    { number: 35, name: 'J. Daccord', pos: 'G', nationality: 'USA' },
    { number: 10, name: 'M. Beniers', pos: 'C', nationality: 'USA' },
    { number: 19, name: 'J. McCann', pos: 'LW', nationality: 'CAN' },
    { number: 7, name: 'J. Eberle', pos: 'RW', nationality: 'CAN' },
    { number: 29, name: 'V. Dunn', pos: 'D', nationality: 'CAN' },
    { number: 6, name: 'A. Larsson', pos: 'D', nationality: 'SWE' }
  ],
  'seattle': [
    { number: 35, name: 'J. Daccord', pos: 'G', nationality: 'USA' },
    { number: 10, name: 'M. Beniers', pos: 'C', nationality: 'USA' },
    { number: 19, name: 'J. McCann', pos: 'LW', nationality: 'CAN' },
    { number: 7, name: 'J. Eberle', pos: 'RW', nationality: 'CAN' },
    { number: 29, name: 'V. Dunn', pos: 'D', nationality: 'CAN' },
    { number: 6, name: 'A. Larsson', pos: 'D', nationality: 'SWE' }
  ],
  'rangers': [
    { number: 31, name: 'I. Shesterkin', pos: 'G', nationality: 'RUS' },
    { number: 93, name: 'M. Zibanejad', pos: 'C', nationality: 'SWE' },
    { number: 10, name: 'A. Panarin', pos: 'LW', nationality: 'RUS' },
    { number: 13, name: 'A. Lafreniere', pos: 'RW', nationality: 'CAN' },
    { number: 23, name: 'A. Fox', pos: 'D', nationality: 'USA' },
    { number: 79, name: 'K. Miller', pos: 'D', nationality: 'USA' }
  ],
  'canucks': [
    { number: 35, name: 'T. Demko', pos: 'G', nationality: 'USA' },
    { number: 40, name: 'E. Pettersson', pos: 'C', nationality: 'SWE' },
    { number: 9, name: 'J. Miller', pos: 'C', nationality: 'USA' },
    { number: 6, name: 'B. Boeser', pos: 'RW', nationality: 'USA' },
    { number: 43, name: 'Q. Hughes', pos: 'D', nationality: 'USA' },
    { number: 17, name: 'F. Hronek', pos: 'D', nationality: 'CZE' }
  ],
  'lightning': [
    { number: 88, name: 'A. Vasilevskiy', pos: 'G', nationality: 'RUS' },
    { number: 21, name: 'B. Point', pos: 'C', nationality: 'CAN' },
    { number: 86, name: 'N. Kucherov', pos: 'RW', nationality: 'RUS' },
    { number: 59, name: 'J. Guentzel', pos: 'LW', nationality: 'USA' },
    { number: 77, name: 'V. Hedman', pos: 'D', nationality: 'SWE' },
    { number: 27, name: 'R. McDonagh', pos: 'D', nationality: 'USA' }
  ],
  'panthers': [
    { number: 72, name: 'S. Bobrovsky', pos: 'G', nationality: 'RUS' },
    { number: 16, name: 'A. Barkov', pos: 'C', nationality: 'FIN' },
    { number: 19, name: 'M. Tkachuk', pos: 'LW', nationality: 'USA' },
    { number: 13, name: 'S. Reinhart', pos: 'RW', nationality: 'CAN' },
    { number: 5, name: 'A. Ekblad', pos: 'D', nationality: 'CAN' },
    { number: 42, name: 'G. Forsling', pos: 'D', nationality: 'SWE' }
  ],
  'capitals': [
    { number: 79, name: 'C. Lindgren', pos: 'G', nationality: 'USA' },
    { number: 8, name: 'A. Ovechkin', pos: 'LW', nationality: 'RUS' },
    { number: 17, name: 'D. Strome', pos: 'C', nationality: 'CAN' },
    { number: 43, name: 'T. Wilson', pos: 'RW', nationality: 'CAN' },
    { number: 74, name: 'J. Carlson', pos: 'D', nationality: 'USA' },
    { number: 6, name: 'J. Chychrun', pos: 'D', nationality: 'CAN' }
  ]
};

// Generate intelligent, realistic starting lineup suggestions for any team name
export function suggestTeamLineup(teamName = '', existingLineup = null) {
  if (existingLineup && Array.isArray(existingLineup) && existingLineup.length > 0) {
    return JSON.parse(JSON.stringify(existingLineup));
  }

  const query = (teamName || '').toLowerCase().trim();

  // Check known keyword matches
  for (const [key, roster] of Object.entries(KNOWN_HOCKEY_SUGGESTIONS)) {
    if (query.includes(key)) {
      return JSON.parse(JSON.stringify(roster));
    }
  }

  // Realistic starter pools for custom teams
  const nameParts = (teamName || 'Custom Team').trim().split(/\s+/);
  const cityOrPrefix = nameParts[0] || 'Team';

  return [
    { number: 30, name: `J. Carter`, pos: 'G', nationality: 'CAN' },
    { number: 19, name: `M. Vance`, pos: 'C', nationality: 'USA' },
    { number: 11, name: `D. Stone`, pos: 'LW', nationality: 'CAN' },
    { number: 88, name: `T. Hayes`, pos: 'RW', nationality: 'SWE' },
    { number: 4, name: `R. Miller`, pos: 'D', nationality: 'USA' },
    { number: 27, name: `C. Reed`, pos: 'D', nationality: 'FIN' }
  ];
}

// Return starter lineup for any team (checks official, custom remembered, or suggests)
export function getTeamLineup(teamId, teamName) {
  if (teamId && NHL_LINEUPS[teamId]) {
    return NHL_LINEUPS[teamId];
  }

  // Check if team is in remembered custom teams in localStorage
  if (typeof window !== 'undefined') {
    try {
      const savedTeams = localStorage.getItem('nhl_hockey_custom_teams');
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        const match = Array.isArray(parsed) && parsed.find(t => 
          (teamId && t.id === teamId) || 
          (teamName && t.name?.toLowerCase() === teamName.toLowerCase())
        );
        if (match && Array.isArray(match.lineup) && match.lineup.length > 0) {
          return JSON.parse(JSON.stringify(match.lineup));
        }
      }
    } catch (e) {
      console.warn('Error reading custom teams in getTeamLineup:', e);
    }
  }

  return suggestTeamLineup(teamName);
}

