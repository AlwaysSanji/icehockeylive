import { useState, useEffect, useRef } from 'react';
import {
  getInitialMatchState,
  getInitialMatches,
  getActiveMatchId,
  subscribeToScoreboard,
  adjustScore,
  startClock,
  pauseClock,
  resetClock,
  adjustClockSeconds,
  setMatchPeriod,
  updateTeamInfo,
  resetGame,
  triggerRemoteHorn,
  setExactClockTime,
  setExactScores,
  updateSchedule,
  addMatch as serviceAddMatch,
  deleteMatch as serviceDeleteMatch,
  selectActiveMatch,
  adjustShots,
  setPowerPlay,
  addMatchIncident,
  updateMatchIncident,
  deleteMatchIncident,
  setMatchIncidents
} from '../services/scoreboardService';
import { isFirebaseConfigured } from '../firebase/config';

export function useScoreboard() {
  const [matchState, setMatchState] = useState(getInitialMatchState);
  const [matches, setMatches] = useState(getInitialMatches);
  const [activeMatchId, setActiveMatchId] = useState(getActiveMatchId);
  const [isFirebaseConnected] = useState(isFirebaseConfigured);

  useEffect(() => {
    const unsubscribe = subscribeToScoreboard((activeData, matchesList, currentActiveId) => {
      if (activeData) {
        setMatchState(activeData);
      }
      if (matchesList && Array.isArray(matchesList)) {
        setMatches(matchesList);
      }
      if (currentActiveId) {
        setActiveMatchId(currentActiveId);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectMatch = async (matchId) => {
    const selected = await selectActiveMatch(matchId);
    if (selected) {
      setMatchState(selected);
      setActiveMatchId(selected.id);
    }
  };

  const handleAddMatch = async (newMatchData) => {
    const created = await serviceAddMatch(newMatchData);
    if (created) {
      setMatchState(created);
      setActiveMatchId(created.id);
      setMatches(prev => [created, ...prev.filter(m => m.id !== created.id)]);
    }
    return created;
  };

  const handleDeleteMatch = async (matchId) => {
    const newActive = await serviceDeleteMatch(matchId);
    if (newActive) {
      setMatchState(newActive);
      setActiveMatchId(newActive.id);
      setMatches(prev => prev.filter(m => m.id !== matchId));
    }
    return newActive;
  };

  return {
    matchState,
    matches,
    activeMatchId,
    isFirebaseConnected,
    // Multi-match Operations (Add & Delete from Remote Control)
    selectMatch: handleSelectMatch,
    addMatch: handleAddMatch,
    deleteMatch: handleDeleteMatch,
    // Match Operations
    incrementHomeScore: () => adjustScore(matchState, 'home', 1),
    decrementHomeScore: () => adjustScore(matchState, 'home', -1),
    incrementAwayScore: () => adjustScore(matchState, 'away', 1),
    decrementAwayScore: () => adjustScore(matchState, 'away', -1),
    // Shots on Goal (SOG)
    incrementHomeShots: () => adjustShots(matchState, 'home', 1),
    decrementHomeShots: () => adjustShots(matchState, 'home', -1),
    incrementAwayShots: () => adjustShots(matchState, 'away', 1),
    decrementAwayShots: () => adjustShots(matchState, 'away', -1),
    // Power Play & Incidents
    setPowerPlay: (team) => setPowerPlay(matchState, team),
    addIncident: (incident) => addMatchIncident(matchState, incident),
    updateIncident: (incidentId, updatedData) => updateMatchIncident(matchState, incidentId, updatedData),
    deleteIncident: (incidentId, decrementScore) => deleteMatchIncident(matchState, incidentId, decrementScore),
    setIncidents: (eventsList) => setMatchIncidents(matchState, eventsList),
    playPeriodBuzzer: () => {},
    // Game Clock
    startClock: () => startClock(matchState),
    pauseClock: (currentRemaining) => pauseClock(matchState, currentRemaining),
    resetClock: (seconds) => resetClock(matchState, seconds),
    adjustClockSeconds: (currentRemaining, delta) => adjustClockSeconds(matchState, currentRemaining, delta),
    setPeriod: (period) => setMatchPeriod(matchState, period),
    updateTeamDetails: (details) => updateTeamInfo(matchState, details),
    resetMatch: () => resetGame(matchState),
    blastHorn: () => {},
    setExactClockTime: (seconds) => setExactClockTime(matchState, seconds),
    setExactScores: (scoreData) => setExactScores(matchState, scoreData),
    updateSchedule: (scheduleData) => updateSchedule(matchState, scheduleData)
  };
}
