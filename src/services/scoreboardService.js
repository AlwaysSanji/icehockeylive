import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { DEFAULT_MATCH_STATE, DEFAULT_MATCHES_LIST, NHL_TEAMS, generateTeamCrestSvg, suggestTeamLineup, getTeamLineup } from '../constants/hockeyData';

const COLLECTION_NAME = 'scoreboards';
const DOC_ID = 'active_match';
const LOCAL_STORAGE_KEY = 'nhl_hockey_live_match';
const LOCAL_STORAGE_MATCHES_KEY = 'nhl_hockey_matches_list';
const LOCAL_STORAGE_ACTIVE_ID_KEY = 'nhl_hockey_active_match_id';
const LOCAL_STORAGE_CUSTOM_TEAMS_KEY = 'nhl_hockey_custom_teams';
const LOCAL_STORAGE_DELETED_TEAMS_KEY = 'nhl_hockey_deleted_teams';
const BROADCAST_CHANNEL_NAME = 'nhl_hockey_sync_channel';

// Web BroadcastChannel for instant local multi-tab sync
let channel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }
}

// In-memory subscribers set for instant same-tab reactive state updates
const localSubscribers = new Set();

// Read matches list from localStorage or fallback to defaults
export function getInitialMatches() {
  if (typeof window === 'undefined') return DEFAULT_MATCHES_LIST;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MATCHES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading matches from localStorage:', e);
  }
  return DEFAULT_MATCHES_LIST;
}

// Read active match ID
export function getActiveMatchId() {
  if (typeof window === 'undefined') return DEFAULT_MATCH_STATE.id;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID_KEY);
    if (saved) return saved;
  } catch (e) {
    console.warn('Error reading activeMatchId from localStorage:', e);
  }
  return DEFAULT_MATCH_STATE.id;
}

// Read current active match state
export function getInitialMatchState() {
  if (typeof window === 'undefined') return DEFAULT_MATCH_STATE;
  try {
    const activeId = getActiveMatchId();
    const matches = getInitialMatches();
    const match = matches.find(m => m.id === activeId);
    if (match) return match;

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_MATCH_STATE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading from localStorage:', e);
  }
  return DEFAULT_MATCH_STATE;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8008/api';

// Subscribe to real-time updates (via Laravel Backend, Firestore onSnapshot, and BroadcastChannel)
export function subscribeToScoreboard(callback) {
  let unsubscribeFirestore = null;
  let lastSeenTimestamp = 0;

  // Register in local subscribers set for instant same-tab reactive state updates
  localSubscribers.add(callback);

  // 1. Initial & Continuous Sync via PHP Laravel Backend API (for ALL viewers & devices)
  const syncWithBackend = async () => {
    try {
      const res = await fetch(`${API_BASE}/scoreboard`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          const serverTs = json.timestamp || json.data.lastUpdatedAt || 0;
          if (serverTs > lastSeenTimestamp) {
            lastSeenTimestamp = serverTs;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
            if (json.matches && Array.isArray(json.matches)) {
              localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(json.matches));
            }
            callback(json.data, json.matches || getInitialMatches(), json.data.id || getActiveMatchId());
          }
        }
      }
    } catch (e) {
      // Backend temporarily offline, continues with local/Firestore
    }
  };

  // Immediate fetch on mount
  syncWithBackend();

  // Background polling every 1.5s so all spectators see admin updates in real-time
  const pollingInterval = setInterval(syncWithBackend, 1500);

  // 2. If Firebase Firestore is configured, listen to Firestore document
  if (isFirebaseConfigured && db) {
    try {
      const matchDocRef = doc(db, COLLECTION_NAME, DOC_ID);
      unsubscribeFirestore = onSnapshot(matchDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          lastSeenTimestamp = Date.now();
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          const matches = data.matches || getInitialMatches();
          callback(data, matches, data.id || getActiveMatchId());
        } else {
          const initial = getInitialMatchState();
          const matches = getInitialMatches();
          setDoc(matchDocRef, { ...initial, matches });
          callback(initial, matches, initial.id);
        }
      }, (err) => {
        console.warn('Firestore subscription note (check rules/network):', err.message || err);
      });
    } catch (err) {
      console.error('Failed to attach Firestore listener:', err);
    }
  }

  // 3. BroadcastChannel listener for multi-tab updates (vital for instant local UI)
  const onBroadcastMessage = (event) => {
    if (event.data) {
      lastSeenTimestamp = Date.now();
      const matches = getInitialMatches();
      const activeId = getActiveMatchId();
      if (event.data.type === 'MATCH_UPDATE') {
        callback(event.data.payload, event.data.matches || matches, event.data.payload?.id || activeId);
      } else if (event.data.type === 'MATCH_ADDED') {
        callback(event.data.newMatch, event.data.matches, event.data.newMatch.id);
      } else if (event.data.type === 'MATCH_DELETED') {
        callback(event.data.activeMatch, event.data.matches, event.data.activeMatch?.id);
      } else if (event.data.type === 'MATCH_SELECTED') {
        callback(event.data.activeMatch, matches, event.data.activeMatch?.id);
      }
    }
  };

  if (channel) {
    channel.addEventListener('message', onBroadcastMessage);
  }

  // 4. Storage event listener for cross-tab fallback
  const onStorageChange = (event) => {
    if ((event.key === LOCAL_STORAGE_KEY || event.key === LOCAL_STORAGE_MATCHES_KEY) && event.newValue) {
      try {
        lastSeenTimestamp = Date.now();
        const activeMatch = getInitialMatchState();
        const matches = getInitialMatches();
        callback(activeMatch, matches, activeMatch.id);
      } catch (e) {
        console.warn(e);
      }
    }
  };
  window.addEventListener('storage', onStorageChange);

  // Return unsubscribe cleanup function
  return () => {
    localSubscribers.delete(callback);
    clearInterval(pollingInterval);
    if (unsubscribeFirestore) unsubscribeFirestore();
    if (channel) channel.removeEventListener('message', onBroadcastMessage);
    window.removeEventListener('storage', onStorageChange);
  };
}

// Dispatch an update to Laravel backend, Firestore, and local channels
export async function updateMatchState(newState) {
  const payload = {
    ...newState,
    lastUpdatedAt: Date.now()
  };

  // Update in localStorage
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  if (payload.id) {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, payload.id);
  }

  // Also update match inside matches list
  const currentMatches = getInitialMatches();
  let found = false;
  const updatedMatches = currentMatches.map(m => {
    if (m.id === payload.id) {
      found = true;
      return { ...m, ...payload };
    }
    return m;
  });
  if (!found && payload.id) {
    updatedMatches.unshift(payload);
  }
  localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(updatedMatches));

  // Instantly notify all local subscribers in this tab (zero latency, no network needed)
  localSubscribers.forEach(cb => {
    try {
      cb(payload, updatedMatches, payload.id);
    } catch (e) {
      console.warn('Error in local subscriber callback:', e);
    }
  });

  if (channel) {
    channel.postMessage({
      type: 'MATCH_UPDATE',
      payload: payload,
      matches: updatedMatches
    });
  }

  // 1. Send to PHP Laravel backend to sync for all network visitors
  try {
    fetch(`${API_BASE}/scoreboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ ...payload, matches: updatedMatches }),
    }).catch(e => console.warn('Laravel sync background note:', e));
  } catch (err) {
    console.warn('Backend sync failed:', err);
  }

  // 2. If Firebase Firestore is configured, push to cloud
  if (isFirebaseConfigured && db) {
    try {
      const matchDocRef = doc(db, COLLECTION_NAME, DOC_ID);
      await setDoc(matchDocRef, { ...payload, matches: updatedMatches }, { merge: true });
    } catch (error) {
      console.error('Error writing match state to Firestore:', error);
    }
  }
}

// Read all remembered custom teams created by admin
export function getCustomTeams() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TEAMS_KEY);
    let list = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(list)) list = [];

    // Also extract any custom teams already present in matches so none are forgotten
    const matches = getInitialMatches();
    let hasNewFromMatches = false;

    matches.forEach(m => {
      [m.home, m.away].forEach(t => {
        if (!t) return;
        const isCustom = t.id === 'custom' || t.id?.startsWith('custom-') || (!NHL_TEAMS[t.id] && t.name);
        if (isCustom && t.name) {
          const exists = list.some(item => item.id === t.id || item.name.toLowerCase() === t.name.toLowerCase());
          if (!exists) {
            const teamId = t.id && t.id !== 'custom' ? t.id : `custom-${t.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            list.push({
              id: teamId,
              name: t.name,
              stadium: m.venue || 'Arena Stadium',
              crestSvg: t.crestSvg || generateTeamCrestSvg(t.name),
              lineup: t.lineup || suggestTeamLineup(t.name),
              createdAt: Date.now()
            });
            hasNewFromMatches = true;
          }
        }
      });
    });

    if (hasNewFromMatches) {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEAMS_KEY, JSON.stringify(list));
    }

    return list;
  } catch (e) {
    console.warn('Error reading custom teams:', e);
    return [];
  }
}

// Save or update an admin-created custom team and its roster
export function saveCustomTeam(teamData) {
  if (!teamData || !teamData.name) return null;
  const list = getCustomTeams();
  const cleanName = teamData.name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const teamId = (teamData.id && teamData.id !== 'custom') ? teamData.id : `custom-${slug || Date.now()}`;

  const crestSvg = teamData.crestSvg || generateTeamCrestSvg(cleanName, teamData.primaryColor);
  const lineup = (teamData.lineup && Array.isArray(teamData.lineup) && teamData.lineup.length > 0) 
    ? teamData.lineup 
    : suggestTeamLineup(cleanName);

  const newTeam = {
    id: teamId,
    name: cleanName,
    stadium: teamData.stadium || teamData.venue || 'Arena Stadium',
    primaryColor: teamData.primaryColor || '#1e40af',
    crestSvg,
    lineup,
    isCustom: true,
    updatedAt: Date.now()
  };

  const existingIdx = list.findIndex(t => t.id === teamId || t.name.toLowerCase() === cleanName.toLowerCase());
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...newTeam };
  } else {
    list.unshift(newTeam);
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEAMS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save custom team to localStorage:', e);
  }

  if (channel) {
    channel.postMessage({
      type: 'CUSTOM_TEAMS_UPDATED',
      customTeams: list
    });
  }

  return newTeam;
}

// Read all deleted team IDs (both official and custom)
export function getDeletedTeamIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_TEAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Delete any team from the league (official or custom)
export function deleteLeagueTeam(teamId) {
  if (!teamId) return;
  // 1. If it's a custom team, also remove from custom teams storage
  const customList = getCustomTeams().filter(t => t.id !== teamId);
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEAMS_KEY, JSON.stringify(customList));
  } catch (e) {
    console.warn('Failed to delete custom team:', e);
  }

  // 2. Add to deleted teams list
  const deleted = getDeletedTeamIds();
  if (!deleted.includes(teamId)) {
    deleted.push(teamId);
    try {
      localStorage.setItem(LOCAL_STORAGE_DELETED_TEAMS_KEY, JSON.stringify(deleted));
    } catch (e) {
      console.warn('Failed to save deleted team:', e);
    }
  }

  if (channel) {
    channel.postMessage({
      type: 'LEAGUE_TEAMS_UPDATED',
      deletedTeams: deleted,
      customTeams: customList
    });
  }
}

// Restore a deleted team back to the league
export function restoreLeagueTeam(teamId) {
  if (!teamId) return;
  const deleted = getDeletedTeamIds().filter(id => id !== teamId);
  try {
    localStorage.setItem(LOCAL_STORAGE_DELETED_TEAMS_KEY, JSON.stringify(deleted));
  } catch (e) {
    console.warn('Failed to restore team:', e);
  }

  if (channel) {
    channel.postMessage({
      type: 'LEAGUE_TEAMS_UPDATED',
      deletedTeams: deleted
    });
  }
}

// Restore all deleted teams back to the league
export function restoreAllLeagueTeams() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_DELETED_TEAMS_KEY);
  } catch (e) {
    console.warn('Failed to restore all teams:', e);
  }

  if (channel) {
    channel.postMessage({
      type: 'LEAGUE_TEAMS_UPDATED',
      deletedTeams: []
    });
  }
}

// Get deleted teams metadata for display in restore UI
export function getDeletedLeagueTeams() {
  const deletedIds = getDeletedTeamIds();
  if (!deletedIds || deletedIds.length === 0) return [];
  
  const allPossibleTeams = [
    ...Object.values(NHL_TEAMS).map(t => ({
      id: t.id,
      name: t.name,
      shortCode: t.shortCode || t.name.slice(0, 3).toUpperCase(),
      city: t.city || '',
      stadium: t.stadium || 'Arena Stadium',
      primaryColor: t.primaryColor || '#1e40af',
      crestSvg: t.crestSvg,
      isCustom: false
    })),
    ...getCustomTeams()
  ];

  return allPossibleTeams.filter(t => deletedIds.includes(t.id));
}

// Delete an admin-created custom team (legacy alias pointing to deleteLeagueTeam)
export function deleteCustomTeam(teamId) {
  deleteLeagueTeam(teamId);
}

// Read all League Teams (both Official NHL and Custom, excluding deleted teams)
export function getAllLeagueTeams() {
  const deletedIds = getDeletedTeamIds();
  const custom = getCustomTeams();
  const official = Object.values(NHL_TEAMS).map(t => {
    const customOverride = custom.find(c => c.id === t.id || c.name.toLowerCase() === t.name.toLowerCase());
    return {
      id: t.id,
      name: t.name,
      shortCode: t.shortCode || t.name.slice(0, 3).toUpperCase(),
      city: t.city || '',
      stadium: t.stadium || 'Arena Stadium',
      primaryColor: t.primaryColor || '#1e40af',
      crestSvg: customOverride?.crestSvg || t.crestSvg,
      lineup: customOverride?.lineup || getTeamLineup(t.id, t.name),
      isCustom: false
    };
  });

  const customOnly = custom.filter(c => !Object.values(NHL_TEAMS).some(o => o.id === c.id || o.name.toLowerCase() === c.name.toLowerCase())).map(c => ({
    id: c.id,
    name: c.name,
    shortCode: c.shortCode || c.name.slice(0, 3).toUpperCase(),
    city: c.city || '',
    stadium: c.stadium || c.venue || 'Arena Stadium',
    primaryColor: c.primaryColor || '#1e40af',
    crestSvg: c.crestSvg || generateTeamCrestSvg(c.name),
    lineup: c.lineup || suggestTeamLineup(c.name),
    isCustom: true
  }));

  const all = [...official, ...customOnly];
  if (!deletedIds || deletedIds.length === 0) return all;
  return all.filter(t => !deletedIds.includes(t.id));
}

// Read all League Players across all teams
export function getAllLeaguePlayers() {
  const teams = getAllLeagueTeams();
  const allPlayers = [];
  teams.forEach(team => {
    const lineup = team.lineup || [];
    lineup.forEach(p => {
      allPlayers.push({
        id: p.id || `${team.id}-${p.number}-${p.name}`,
        number: p.number,
        name: p.name,
        pos: p.pos || 'F',
        nationality: p.nationality || 'CAN',
        captain: p.captain || '',
        teamId: team.id,
        teamName: team.name,
        teamShortCode: team.shortCode,
        teamCrest: team.crestSvg,
        isCustom: Boolean(p.isCustom || team.isCustom)
      });
    });
  });
  return allPlayers;
}

// Add a player to any team (official or custom)
export function addPlayerToTeam(teamId, playerData) {
  if (!teamId || !playerData || !playerData.name) return null;
  const allTeams = getAllLeagueTeams();
  const targetTeam = allTeams.find(t => t.id === teamId || t.name.toLowerCase() === teamId.toLowerCase());
  if (!targetTeam) return null;

  const currentLineup = getTeamLineup(targetTeam.id, targetTeam.name) || [];
  const newPlayer = {
    id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    number: parseInt(playerData.number, 10) || (currentLineup.length + 1),
    name: playerData.name.trim(),
    pos: playerData.pos || 'F',
    nationality: playerData.nationality ? playerData.nationality.trim().toUpperCase() : 'CAN',
    captain: playerData.captain || '',
    isCustom: true
  };

  const updatedLineup = [...currentLineup, newPlayer];

  saveCustomTeam({
    id: targetTeam.id,
    name: targetTeam.name,
    stadium: targetTeam.stadium,
    primaryColor: targetTeam.primaryColor,
    crestSvg: targetTeam.crestSvg,
    lineup: updatedLineup,
    isCustom: targetTeam.isCustom
  });

  return newPlayer;
}

// Remove a player from a team
export function deletePlayerFromTeam(teamId, playerIdentifier) {
  if (!teamId || !playerIdentifier) return;
  const allTeams = getAllLeagueTeams();
  const targetTeam = allTeams.find(t => t.id === teamId || t.name.toLowerCase() === teamId.toLowerCase());
  if (!targetTeam) return;

  const currentLineup = getTeamLineup(targetTeam.id, targetTeam.name) || [];
  const updatedLineup = currentLineup.filter(p => 
    p.id !== playerIdentifier && 
    String(p.number) !== String(playerIdentifier) && 
    p.name.toLowerCase() !== String(playerIdentifier).toLowerCase()
  );

  saveCustomTeam({
    id: targetTeam.id,
    name: targetTeam.name,
    stadium: targetTeam.stadium,
    primaryColor: targetTeam.primaryColor,
    crestSvg: targetTeam.crestSvg,
    lineup: updatedLineup,
    isCustom: targetTeam.isCustom
  });
}

// ADD MATCH (from Remote Control)
export async function addMatch(matchData) {
  const now = Date.now();
  const newId = matchData.id || `match-${now}-${Math.floor(Math.random() * 1000)}`;

  // Auto-remember admin custom teams if created/customized
  let homeTeamId = matchData.home?.id || 'custom-home';
  let homeCrestSvg = matchData.home?.crestSvg || null;
  let homeLineup = matchData.home?.lineup || null;

  const isHomeCustom = homeTeamId === 'custom' || homeTeamId.startsWith('custom-') || !NHL_TEAMS[homeTeamId];
  if (isHomeCustom && matchData.home?.name) {
    const saved = saveCustomTeam({
      id: homeTeamId !== 'custom' ? homeTeamId : null,
      name: matchData.home.name,
      stadium: matchData.venue,
      crestSvg: matchData.home.crestSvg,
      lineup: matchData.home.lineup
    });
    if (saved) {
      homeTeamId = saved.id;
      homeCrestSvg = saved.crestSvg;
      homeLineup = saved.lineup;
    }
  }

  let awayTeamId = matchData.away?.id || 'custom-away';
  let awayCrestSvg = matchData.away?.crestSvg || null;
  let awayLineup = matchData.away?.lineup || null;

  const isAwayCustom = awayTeamId === 'custom' || awayTeamId.startsWith('custom-') || !NHL_TEAMS[awayTeamId];
  if (isAwayCustom && matchData.away?.name) {
    const saved = saveCustomTeam({
      id: awayTeamId !== 'custom' ? awayTeamId : null,
      name: matchData.away.name,
      stadium: matchData.venue,
      crestSvg: matchData.away.crestSvg,
      lineup: matchData.away.lineup
    });
    if (saved) {
      awayTeamId = saved.id;
      awayCrestSvg = saved.crestSvg;
      awayLineup = saved.lineup;
    }
  }

  const newMatch = {
    id: newId,
    home: {
      id: homeTeamId,
      name: matchData.home?.name || 'Home Team',
      score: matchData.home?.score !== undefined ? parseInt(matchData.home.score, 10) : 0,
      shots: matchData.home?.shots !== undefined ? parseInt(matchData.home.shots, 10) : 0,
      crestSvg: homeCrestSvg || NHL_TEAMS[homeTeamId]?.crestSvg || generateTeamCrestSvg(matchData.home?.name),
      lineup: homeLineup
    },
    away: {
      id: awayTeamId,
      name: matchData.away?.name || 'Away Team',
      score: matchData.away?.score !== undefined ? parseInt(matchData.away.score, 10) : 0,
      shots: matchData.away?.shots !== undefined ? parseInt(matchData.away.shots, 10) : 0,
      crestSvg: awayCrestSvg || NHL_TEAMS[awayTeamId]?.crestSvg || generateTeamCrestSvg(matchData.away?.name),
      lineup: awayLineup
    },
    lineupsDeclared: matchData.lineupsDeclared !== undefined ? matchData.lineupsDeclared : Boolean(homeLineup?.length || awayLineup?.length),
    period: matchData.period || '1',
    periodScores: matchData.periodScores || {
      p1: { home: 0, away: 0 },
      p2: { home: 0, away: 0 },
      p3: { home: 0, away: 0 },
      ot: { home: 0, away: 0 }
    },
    clock: {
      running: false,
      remainingSeconds: matchData.clock?.remainingSeconds || 1200,
      defaultPeriodSeconds: matchData.clock?.defaultPeriodSeconds || 1200,
      lastUpdatedAt: now
    },
    venue: matchData.venue || 'United Center',
    date: matchData.date || 'Wed, Oct 14, 2026',
    dateTime: matchData.dateTime || `${matchData.date || 'Wed, Oct 14, 2026'} 19:00`,
    referee: matchData.referee || 'Furlatt E.',
    league: 'NHL',
    country: 'USA',
    status: matchData.status || (matchData.period === 'FT' ? 'Finished' : (matchData.period === 'UPCOMING' ? 'Upcoming' : 'Live')),
    statusBadge: matchData.statusBadge || (matchData.period === 'FT' ? 'FT' : (matchData.period === 'UPCOMING' ? '19:00' : 'P1')),
    events: Array.isArray(matchData.events) ? matchData.events : [],
    lastUpdatedAt: now
  };

  const matches = getInitialMatches();
  const updatedMatches = [newMatch, ...matches];

  // Save to local
  localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(updatedMatches));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMatch));
  localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, newId);

  // Broadcast
  if (channel) {
    channel.postMessage({
      type: 'MATCH_ADDED',
      newMatch: newMatch,
      matches: updatedMatches
    });
  }

  // Push to backend
  try {
    fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(newMatch),
    }).catch(e => console.warn('Laravel add match note:', e));
  } catch (err) {
    console.warn('Backend match add failed:', err);
  }

  // Push to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const matchDocRef = doc(db, COLLECTION_NAME, DOC_ID);
      await setDoc(matchDocRef, { ...newMatch, matches: updatedMatches }, { merge: true });
    } catch (error) {
      console.error('Error writing new match to Firestore:', error);
    }
  }

  return newMatch;
}

// DELETE MATCH (from Remote Control)
export async function deleteMatch(matchId) {
  const matches = getInitialMatches();
  const remaining = matches.filter(m => m.id !== matchId);

  // Ensure there is at least one match
  const fallbackMatches = remaining.length > 0 ? remaining : DEFAULT_MATCHES_LIST;
  const newActive = fallbackMatches[0];

  // Save to local
  localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(fallbackMatches));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newActive));
  localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, newActive.id);

  // Broadcast
  if (channel) {
    channel.postMessage({
      type: 'MATCH_DELETED',
      deletedId: matchId,
      activeMatch: newActive,
      matches: fallbackMatches
    });
  }

  // Push to backend
  try {
    fetch(`${API_BASE}/matches/${matchId}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
    }).catch(e => console.warn('Laravel delete match note:', e));
  } catch (err) {
    console.warn('Backend match delete failed:', err);
  }

  // Push to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const matchDocRef = doc(db, COLLECTION_NAME, DOC_ID);
      await setDoc(matchDocRef, { ...newActive, matches: fallbackMatches }, { merge: true });
    } catch (error) {
      console.error('Error deleting match from Firestore:', error);
    }
  }

  return newActive;
}

// SELECT ACTIVE MATCH (switch match in Remote Control)
export async function selectActiveMatch(matchId) {
  const matches = getInitialMatches();
  const found = matches.find(m => m.id === matchId);
  if (!found) return null;

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(found));
  localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, found.id);

  if (channel) {
    channel.postMessage({
      type: 'MATCH_SELECTED',
      activeMatch: found
    });
  }

  // Sync active match with backend
  try {
    fetch(`${API_BASE}/scoreboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ ...found, matches }),
    }).catch(e => console.warn('Backend select match note:', e));
  } catch (e) {
    console.warn(e);
  }

  // Sync active match with Firebase Firestore
  if (isFirebaseConfigured && db) {
    try {
      const matchDocRef = doc(db, COLLECTION_NAME, DOC_ID);
      await setDoc(matchDocRef, { ...found, matches }, { merge: true });
    } catch (error) {
      console.error('Error syncing active match selection to Firestore:', error);
    }
  }

  return found;
}

// Score adjustment helpers
export async function adjustScore(currentState, team, delta) {
  const latest = getInitialMatchState();
  const base = (latest && latest.id === currentState?.id) ? latest : currentState;
  const currentScore = base[team]?.score || 0;
  const newScore = Math.max(0, currentScore + delta);

  const updatedState = {
    ...base,
    [team]: {
      ...base[team],
      score: newScore
    }
  };

  await updateMatchState(updatedState);
  return updatedState;
}

// Shots on Goal (SOG) adjustment
export async function adjustShots(currentState, team, delta) {
  const latest = getInitialMatchState();
  const base = (latest && latest.id === currentState?.id) ? latest : currentState;
  const currentShots = base[team]?.shots !== undefined ? base[team].shots : (base[team]?.score ? base[team].score * 6 + 10 : 25);
  const newShots = Math.max(0, currentShots + delta);

  const updatedState = {
    ...base,
    [team]: {
      ...base[team],
      shots: newShots
    }
  };

  await updateMatchState(updatedState);
  return updatedState;
}

// Power Play toggle (team: 'home', 'away', or null)
export async function setPowerPlay(currentState, team) {
  const latest = getInitialMatchState();
  const base = (latest && latest.id === currentState?.id) ? latest : currentState;
  const currentPP = base.powerPlay;
  const newPP = currentPP === team ? null : team;

  const updatedState = {
    ...base,
    powerPlay: newPP
  };

  await updateMatchState(updatedState);
  return updatedState;
}

// Add a live match incident (goal, penalty, timeout) to the match timeline
export async function addMatchIncident(currentState, incident) {
  const latest = getInitialMatchState();
  const base = (latest && latest.id === currentState?.id) ? latest : currentState;
  const currentEvents = Array.isArray(base.events) ? base.events : [];

  const eventType = incident.type || (incident.scorer ? 'goal' : incident.shotPlayer ? 'shot' : incident.penaltyPlayer ? 'penalty' : 'goal');

  const newEvent = {
    id: incident.id || Date.now().toString(),
    createdAt: Date.now(),
    type: eventType,
    ...incident
  };

  let updatedState = {
    ...base,
    events: [newEvent, ...currentEvents]
  };

  // If this is a goal and team is provided, increment score atomically if requested
  if (eventType === 'goal' && incident.team && incident.incrementScore !== false) {
    const team = incident.team;
    const currentScore = updatedState[team]?.score || 0;
    const newScore = currentScore + 1;
    updatedState = {
      ...updatedState,
      [team]: {
        ...updatedState[team],
        score: newScore
      }
    };
    if (!newEvent.score) {
      const hScore = updatedState.home?.score ?? 0;
      const aScore = updatedState.away?.score ?? 0;
      newEvent.score = `${hScore} - ${aScore}`;
    }
  }

  // If this is a shot and team is provided, increment shots atomically if requested
  if (eventType === 'shot' && incident.team && incident.incrementShots !== false) {
    const team = incident.team;
    const currentShots = updatedState[team]?.shots !== undefined ? updatedState[team].shots : 0;
    updatedState = {
      ...updatedState,
      [team]: {
        ...updatedState[team],
        shots: currentShots + 1
      }
    };
  }

  await updateMatchState(updatedState);
  return updatedState;
}

// Update / Edit an existing timeline incident
export async function updateMatchIncident(currentState, incidentId, updatedIncident) {
  const latest = getInitialMatchState();
  const base = (latest && latest.id === currentState?.id) ? latest : currentState;
  const currentEvents = Array.isArray(base.events) ? base.events : [];
  const updatedEvents = currentEvents.map(evt => {
    if (String(evt.id) === String(incidentId)) {
      return {
        ...evt,
        ...updatedIncident,
        id: evt.id
      };
    }
    return evt;
  });

  const updatedState = {
    ...base,
    events: updatedEvents
  };

  await updateMatchState(updatedState);
  return updatedState;
}

// Delete an incident from the timeline (with optional score rollback if it was a goal or shot)
export async function deleteMatchIncident(currentState, incidentId, decrementScore = false, decrementShots = false) {
  const latest = getInitialMatchState();
  const base = (latest && latest.id === currentState?.id) ? latest : currentState;
  const currentEvents = Array.isArray(base.events) ? base.events : [];
  const target = currentEvents.find(evt => String(evt.id) === String(incidentId));
  const remainingEvents = currentEvents.filter(evt => String(evt.id) !== String(incidentId));

  let updatedState = {
    ...base,
    events: remainingEvents
  };

  // If a goal is deleted and requested, rollback score
  if (decrementScore && (target?.type === 'goal' || target?.scorer) && target?.team) {
    const currentScore = updatedState[target.team]?.score || 0;
    updatedState[target.team] = {
      ...updatedState[target.team],
      score: Math.max(0, currentScore - 1)
    };
  }

  // If a shot is deleted and requested, rollback shots
  if (decrementShots && (target?.type === 'shot' || target?.shotPlayer) && target?.team) {
    const currentShots = updatedState[target.team]?.shots || 0;
    updatedState[target.team] = {
      ...updatedState[target.team],
      shots: Math.max(0, currentShots - 1)
    };
  }

  await updateMatchState(updatedState);
  return updatedState;
}

// Bulk set or reorder match timeline incidents
export async function setMatchIncidents(currentState, eventsList) {
  const updatedState = {
    ...currentState,
    events: Array.isArray(eventsList) ? eventsList : []
  };

  await updateMatchState(updatedState);
  return updatedState;
}

// Clock controls: Start, Pause, Reset, Adjust
export async function startClock(currentState) {
  const updatedState = {
    ...currentState,
    clock: {
      ...currentState.clock,
      running: true,
      lastUpdatedAt: Date.now()
    }
  };
  await updateMatchState(updatedState);
}

export async function pauseClock(currentState, currentRemaining) {
  const remaining = currentRemaining !== undefined ? currentRemaining : currentState.clock.remainingSeconds;
  const updatedState = {
    ...currentState,
    clock: {
      ...currentState.clock,
      running: false,
      remainingSeconds: Math.max(0, remaining),
      lastUpdatedAt: Date.now()
    }
  };
  await updateMatchState(updatedState);
}

export async function resetClock(currentState, seconds) {
  const periodSeconds = seconds || currentState.clock?.defaultPeriodSeconds || 1200;
  const updatedState = {
    ...currentState,
    clock: {
      ...currentState.clock,
      running: false,
      remainingSeconds: periodSeconds,
      defaultPeriodSeconds: periodSeconds,
      lastUpdatedAt: Date.now()
    }
  };
  await updateMatchState(updatedState);
}

export async function adjustClockSeconds(currentState, currentRemaining, delta) {
  const newRemaining = Math.max(0, currentRemaining + delta);
  const updatedState = {
    ...currentState,
    clock: {
      ...currentState.clock,
      remainingSeconds: newRemaining,
      lastUpdatedAt: Date.now()
    }
  };
  await updateMatchState(updatedState);
}

// Period controls
export async function setMatchPeriod(currentState, newPeriod) {
  const isFinished = newPeriod === 'FT';
  const updatedState = {
    ...currentState,
    period: newPeriod,
    status: isFinished ? 'Finished' : (newPeriod === 'UPCOMING' ? 'Upcoming' : 'Live'),
    statusBadge: isFinished ? 'FT' : (newPeriod === 'UPCOMING' ? (currentState.time || '19:00') : `P${newPeriod}`),
    clock: isFinished ? {
      ...currentState.clock,
      running: false,
      remainingSeconds: 0,
      lastUpdatedAt: Date.now()
    } : currentState.clock
  };
  await updateMatchState(updatedState);
}

// Edit Team / Match info
export async function updateTeamInfo(currentState, newInfo) {
  const updatedState = {
    ...currentState,
    ...newInfo
  };
  await updateMatchState(updatedState);
}

// Reset Game / New Game
export async function resetGame(currentState) {
  const updatedState = {
    ...currentState,
    home: { ...currentState.home, score: 0, shots: 0 },
    away: { ...currentState.away, score: 0, shots: 0 },
    period: '1',
    periodScores: {
      p1: { home: 0, away: 0 },
      p2: { home: 0, away: 0 },
      p3: { home: 0, away: 0 },
      ot: { home: 0, away: 0 }
    },
    clock: {
      running: false,
      remainingSeconds: 1200,
      defaultPeriodSeconds: 1200,
      lastUpdatedAt: Date.now()
    }
  };
  await updateMatchState(updatedState);
}

// Remotely trigger arena horn sound (Disabled)
export async function triggerRemoteHorn(currentState) {
  // Audio disabled per user requirement
}

// ADMIN: Exact time correction (minutes & seconds)
export async function setExactClockTime(currentState, totalSeconds) {
  const sanitizedSeconds = Math.max(0, parseInt(totalSeconds, 10) || 0);
  const updatedState = {
    ...currentState,
    clock: {
      ...currentState.clock,
      remainingSeconds: sanitizedSeconds,
      lastUpdatedAt: Date.now()
    }
  };
  await updateMatchState(updatedState);
}

// ADMIN: Direct score override (Home, Away, Shots, Period breakdown)
export async function setExactScores(currentState, scoreData) {
  const updatedState = {
    ...currentState,
    home: {
      ...currentState.home,
      score: scoreData.homeScore !== undefined ? Math.max(0, parseInt(scoreData.homeScore, 10) || 0) : currentState.home?.score || 0,
      shots: scoreData.homeShots !== undefined ? Math.max(0, parseInt(scoreData.homeShots, 10) || 0) : currentState.home?.shots || 0
    },
    away: {
      ...currentState.away,
      score: scoreData.awayScore !== undefined ? Math.max(0, parseInt(scoreData.awayScore, 10) || 0) : currentState.away?.score || 0,
      shots: scoreData.awayShots !== undefined ? Math.max(0, parseInt(scoreData.awayShots, 10) || 0) : currentState.away?.shots || 0
    },
    periodScores: scoreData.periodScores ? {
      ...currentState.periodScores,
      ...scoreData.periodScores
    } : currentState.periodScores
  };
  await updateMatchState(updatedState);
}

// ADMIN: Update match schedule (Date, Puck Drop Time, Venue, Referee, Status/Period)
export async function updateSchedule(currentState, scheduleData) {
  const updatedState = {
    ...currentState,
    ...scheduleData,
    period: scheduleData.period || scheduleData.status || currentState.period
  };
  await updateMatchState(updatedState);
}

const LOCAL_STORAGE_STANDINGS_KEY = 'nhl_hockey_standings_overrides';

// Read manual standings overrides
export function getStandingsOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STANDINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading standings overrides:', e);
  }
  return {};
}

// Save standings override for a team
export function saveStandingsOverride(teamId, overrideData) {
  if (typeof window === 'undefined') return;
  try {
    const current = getStandingsOverrides();
    const updated = {
      ...current,
      [teamId]: {
        ...(current[teamId] || {}),
        ...overrideData
      }
    };
    localStorage.setItem(LOCAL_STORAGE_STANDINGS_KEY, JSON.stringify(updated));
    if (channel) {
      channel.postMessage({ type: 'STANDINGS_UPDATED', overrides: updated });
    }
  } catch (e) {
    console.warn('Error saving standings override:', e);
  }
}

// Reset all standings overrides to pure auto-calculated
export function resetStandingsOverrides() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_STANDINGS_KEY);
    if (channel) {
      channel.postMessage({ type: 'STANDINGS_UPDATED', overrides: {} });
    }
  } catch (e) {
    console.warn('Error resetting standings overrides:', e);
  }
}

// Calculate comprehensive league standings from recorded matches with overrides
export function calculateLeagueStandings(matches = []) {
  const allTeams = getAllLeagueTeams();
  const overrides = getStandingsOverrides();

  // Initialize team records map
  const tableMap = {};
  allTeams.forEach(t => {
    tableMap[t.id] = {
      id: t.id,
      name: t.name,
      shortCode: t.shortCode || t.id.slice(0, 3).toUpperCase(),
      crestSvg: t.crestSvg,
      city: t.city || 'NHL',
      stadium: t.stadium || 'Arena',
      gp: 0,
      w: 0,
      l: 0,
      otl: 0,
      pts: 0,
      gf: 0,
      ga: 0,
      diff: 0,
      form: []
    };
  });

  // Calculate from completed matches
  matches.forEach(m => {
    const isFinished = m.period === 'FT' || m.status === 'Finished' || m.statusBadge === 'FT';
    if (!isFinished) return;

    const hId = m.home?.id;
    const aId = m.away?.id;
    if (!hId || !aId) return;

    // Ensure teams exist in map
    if (!tableMap[hId]) {
      tableMap[hId] = {
        id: hId,
        name: m.home?.name || 'Home',
        shortCode: hId.slice(0, 3).toUpperCase(),
        crestSvg: m.home?.crestSvg,
        gp: 0, w: 0, l: 0, otl: 0, pts: 0, gf: 0, ga: 0, diff: 0, form: []
      };
    }
    if (!tableMap[aId]) {
      tableMap[aId] = {
        id: aId,
        name: m.away?.name || 'Away',
        shortCode: aId.slice(0, 3).toUpperCase(),
        crestSvg: m.away?.crestSvg,
        gp: 0, w: 0, l: 0, otl: 0, pts: 0, gf: 0, ga: 0, diff: 0, form: []
      };
    }

    const hScore = m.home?.score ?? 0;
    const aScore = m.away?.score ?? 0;
    const wentToOT = m.wentToOT || m.period === 'OT' || m.period === 'SO';

    tableMap[hId].gp += 1;
    tableMap[aId].gp += 1;
    tableMap[hId].gf += hScore;
    tableMap[hId].ga += aScore;
    tableMap[aId].gf += aScore;
    tableMap[aId].ga += hScore;

    if (hScore > aScore) {
      tableMap[hId].w += 1;
      tableMap[hId].pts += 2;
      tableMap[hId].form.unshift('W');
      if (wentToOT) {
        tableMap[aId].otl += 1;
        tableMap[aId].pts += 1;
        tableMap[aId].form.unshift('OTL');
      } else {
        tableMap[aId].l += 1;
        tableMap[aId].form.unshift('L');
      }
    } else if (aScore > hScore) {
      tableMap[aId].w += 1;
      tableMap[aId].pts += 2;
      tableMap[aId].form.unshift('W');
      if (wentToOT) {
        tableMap[hId].otl += 1;
        tableMap[hId].pts += 1;
        tableMap[hId].form.unshift('OTL');
      } else {
        tableMap[hId].l += 1;
        tableMap[hId].form.unshift('L');
      }
    } else {
      // Tie fallback
      tableMap[hId].pts += 1;
      tableMap[aId].pts += 1;
    }
  });

  // Calculate goal differentials and apply admin overrides
  const standingsList = Object.values(tableMap).map(team => {
    team.diff = team.gf - team.ga;
    const ov = overrides[team.id];
    if (ov) {
      return {
        ...team,
        gp: ov.gp !== undefined ? ov.gp : team.gp,
        w: ov.w !== undefined ? ov.w : team.w,
        l: ov.l !== undefined ? ov.l : team.l,
        otl: ov.otl !== undefined ? ov.otl : team.otl,
        pts: ov.pts !== undefined ? ov.pts : (ov.w !== undefined ? ov.w * 2 + (ov.otl || 0) : team.pts),
        gf: ov.gf !== undefined ? ov.gf : team.gf,
        ga: ov.ga !== undefined ? ov.ga : team.ga,
        diff: ov.gf !== undefined && ov.ga !== undefined ? (ov.gf - ov.ga) : team.diff,
        isOverridden: true
      };
    }
    return team;
  });

  // Sort by PTS desc, W desc, DIFF desc, GF desc
  standingsList.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.w !== a.w) return b.w - a.w;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.gf - a.gf;
  });

  return standingsList;
}

