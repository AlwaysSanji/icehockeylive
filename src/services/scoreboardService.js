import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { DEFAULT_MATCH_STATE, DEFAULT_MATCHES_LIST } from '../constants/hockeyData';

const COLLECTION_NAME = 'scoreboards';
const DOC_ID = 'active_match';
const LOCAL_STORAGE_KEY = 'nhl_hockey_live_match';
const LOCAL_STORAGE_MATCHES_KEY = 'nhl_hockey_matches_list';
const LOCAL_STORAGE_ACTIVE_ID_KEY = 'nhl_hockey_active_match_id';
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

// ADD MATCH (from Remote Control)
export async function addMatch(matchData) {
  const now = Date.now();
  const newId = matchData.id || `match-${now}-${Math.floor(Math.random() * 1000)}`;

  const newMatch = {
    id: newId,
    home: {
      id: matchData.home?.id || 'custom-home',
      name: matchData.home?.name || 'Home Team',
      score: matchData.home?.score !== undefined ? parseInt(matchData.home.score, 10) : 0,
      shots: matchData.home?.shots !== undefined ? parseInt(matchData.home.shots, 10) : 0,
      crestSvg: matchData.home?.crestSvg || null,
      lineup: matchData.home?.lineup || null
    },
    away: {
      id: matchData.away?.id || 'custom-away',
      name: matchData.away?.name || 'Away Team',
      score: matchData.away?.score !== undefined ? parseInt(matchData.away.score, 10) : 0,
      shots: matchData.away?.shots !== undefined ? parseInt(matchData.away.shots, 10) : 0,
      crestSvg: matchData.away?.crestSvg || null,
      lineup: matchData.away?.lineup || null
    },
    lineupsDeclared: matchData.lineupsDeclared !== undefined ? matchData.lineupsDeclared : Boolean(matchData.home?.lineup?.length || matchData.away?.lineup?.length),
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
  const currentScore = currentState[team]?.score || 0;
  const newScore = Math.max(0, currentScore + delta);

  const updatedState = {
    ...currentState,
    [team]: {
      ...currentState[team],
      score: newScore
    }
  };

  await updateMatchState(updatedState);
}

// Shots on Goal (SOG) adjustment
export async function adjustShots(currentState, team, delta) {
  const currentShots = currentState[team]?.shots !== undefined ? currentState[team].shots : (currentState[team]?.score ? currentState[team].score * 6 + 10 : 25);
  const newShots = Math.max(0, currentShots + delta);

  const updatedState = {
    ...currentState,
    [team]: {
      ...currentState[team],
      shots: newShots
    }
  };

  await updateMatchState(updatedState);
}

// Power Play toggle (team: 'home', 'away', or null)
export async function setPowerPlay(currentState, team) {
  const currentPP = currentState.powerPlay;
  const newPP = currentPP === team ? null : team;

  const updatedState = {
    ...currentState,
    powerPlay: newPP
  };

  await updateMatchState(updatedState);
}

// Add a live match incident (goal, penalty, etc.) to the match timeline
export async function addMatchIncident(currentState, incident) {
  const currentEvents = currentState.events || [];
  const newEvent = {
    id: Date.now(),
    ...incident
  };

  const updatedState = {
    ...currentState,
    events: [newEvent, ...currentEvents]
  };

  await updateMatchState(updatedState);
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
  const updatedState = {
    ...currentState,
    period: newPeriod
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

// Remotely trigger arena horn sound
export async function triggerRemoteHorn(currentState) {
  const updatedState = {
    ...currentState,
    lastHornTimestamp: Date.now()
  };
  await updateMatchState(updatedState);
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
