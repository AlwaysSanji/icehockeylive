import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Clock
} from 'lucide-react';
import { useGameClock } from '../hooks/useGameClock';
import { NHL_TEAMS, getTeamLineup, suggestTeamLineup, generateTeamCrestSvg } from '../constants/hockeyData';
import { getCustomTeams, saveCustomTeam, deleteCustomTeam } from '../services/scoreboardService';
import { AdminPanel } from './AdminPanel';

export function RemoteView({ 
  matchState, 
  matches = [],
  scoreboard, 
  currentUser,
  onSelectMatch,
  onAddMatch,
  onDeleteMatch,
  onBackToScoreboard,
  onOpenTeamEditor,
  onLogout
}) {
  const { formattedTime, remainingSeconds, isRunning } = useGameClock(matchState?.clock);
  const isAdmin = currentUser?.username === 'admin' || currentUser?.email?.includes('admin');
  const [consoleTab, setConsoleTab] = useState('operator'); // 'operator' or 'admin'

  // Team metadata & crests
  const homeTeamId = matchState?.home?.id;
  const awayTeamId = matchState?.away?.id;
  const homeCrest = NHL_TEAMS[homeTeamId]?.crestSvg || matchState?.home?.crestSvg || NHL_TEAMS.blackhawks.crestSvg;
  const awayCrest = NHL_TEAMS[awayTeamId]?.crestSvg || matchState?.away?.crestSvg || NHL_TEAMS.penguins.crestSvg;
  const homeName = matchState?.home?.name || 'Home Team';
  const awayName = matchState?.away?.name || 'Away Team';
  const homeScore = matchState?.home?.score ?? 0;
  const awayScore = matchState?.away?.score ?? 0;
  const homeShots = matchState?.home?.shots ?? (homeScore ? homeScore * 5 + 10 : 25);
  const awayShots = matchState?.away?.shots ?? (awayScore ? awayScore * 5 + 8 : 22);

  // Active match tracking for clear admin orientation
  const activeMatchIndex = matches.findIndex(m => m.id === matchState?.id);
  const currentMatchNumber = activeMatchIndex >= 0 ? activeMatchIndex + 1 : 1;
  const totalMatches = Math.max(matches.length, 1);
  const isCompleted = matchState?.period === 'FT' || matchState?.status === 'Finished' || matchState?.status === 'FT';

  // Lineups for incident logger
  const homeLineup = useMemo(() => getTeamLineup(homeTeamId, homeName), [homeTeamId, homeName]);
  const awayLineup = useMemo(() => getTeamLineup(awayTeamId, awayName), [awayTeamId, awayName]);

  // Remembered Custom Teams created by admin
  const [customTeams, setCustomTeams] = useState(() => getCustomTeams());

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Refresh custom teams list whenever modal is opened
  useEffect(() => {
    if (isAddModalOpen) {
      setCustomTeams(getCustomTeams());
    }
  }, [isAddModalOpen]);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addHomeKey, setAddHomeKey] = useState('blackhawks');
  const [addHomeName, setAddHomeName] = useState('Chicago Blackhawks');
  const [addAwayKey, setAddAwayKey] = useState('penguins');
  const [addAwayName, setAddAwayName] = useState('Pittsburgh Penguins');
  const [addVenue, setAddVenue] = useState('United Center');
  const [addDate, setAddDate] = useState('Wed, Oct 14, 2026');
  const [addTime, setAddTime] = useState('19:00');
  const [addPeriod, setAddPeriod] = useState('1');
  const [addHomeScore, setAddHomeScore] = useState(0);
  const [addAwayScore, setAddAwayScore] = useState(0);
  const [addReferee, setAddReferee] = useState('Furlatt E.');
  const [addLineupsDeclared, setAddLineupsDeclared] = useState(true);
  const [addHomeLineup, setAddHomeLineup] = useState(() => getTeamLineup('blackhawks', 'Chicago Blackhawks'));
  const [addAwayLineup, setAddAwayLineup] = useState(() => getTeamLineup('penguins', 'Pittsburgh Penguins'));

  // Delete Match Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMatchToDelete, setSelectedMatchToDelete] = useState(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Switch Match Modal State & Active Match Filter ('all', 'live', 'upcoming', 'finished')
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [matchFilter, setMatchFilter] = useState('all');

  // Categorize matches by status
  const getMatchCategory = (m) => {
    if (!m) return 'live';
    const period = String(m.period || '').toUpperCase();
    const status = String(m.status || '').toLowerCase();
    const badge = String(m.statusBadge || '').toUpperCase();

    if (period === 'FT' || status === 'finished' || status === 'ft' || badge === 'FT') {
      return 'finished';
    }
    if (period === 'UPCOMING' || status === 'upcoming' || badge === 'SCHED' || (!m.period && m.dateTime)) {
      return 'upcoming';
    }
    return 'live';
  };

  const liveMatchesCount = useMemo(() => matches.filter(m => getMatchCategory(m) === 'live').length, [matches]);
  const upcomingMatchesCount = useMemo(() => matches.filter(m => getMatchCategory(m) === 'upcoming').length, [matches]);
  const finishedMatchesCount = useMemo(() => matches.filter(m => getMatchCategory(m) === 'finished').length, [matches]);

  const filteredMatchesList = useMemo(() => {
    if (matchFilter === 'live') return matches.filter(m => getMatchCategory(m) === 'live');
    if (matchFilter === 'upcoming') return matches.filter(m => getMatchCategory(m) === 'upcoming');
    if (matchFilter === 'finished') return matches.filter(m => getMatchCategory(m) === 'finished');
    return matches;
  }, [matches, matchFilter]);

  // Quick Incident Logger & Timeline Editor Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [editingIncidentId, setEditingIncidentId] = useState(null);
  const [incidentTeam, setIncidentTeam] = useState('home');
  const [incidentType, setIncidentType] = useState('goal'); // 'goal', 'shot', 'penalty', 'timeout'
  const [incidentPlayer, setIncidentPlayer] = useState('');
  const [incidentAssist, setIncidentAssist] = useState('');
  const [incidentPenaltyReason, setIncidentPenaltyReason] = useState('Tripping');
  const [incidentPenaltyMins, setIncidentPenaltyMins] = useState(2);
  const [incidentMinute, setIncidentMinute] = useState('');
  const [incidentPeriod, setIncidentPeriod] = useState('1');
  const [incidentGoalType, setIncidentGoalType] = useState('EV');
  const [timelineFilter, setTimelineFilter] = useState('all'); // 'all', 'goal', 'penalty', 'shot'

  // Shot Maker Modal State
  const [isShotModalOpen, setIsShotModalOpen] = useState(false);
  const [shotTeam, setShotTeam] = useState('home');
  const [shotPlayer, setShotPlayer] = useState('');
  const [shotMinute, setShotMinute] = useState('');
  const [shotPeriod, setShotPeriod] = useState('1');

  // Spacebar keyboard shortcut for clock start/stop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.code === 'Space' && !isCompleted) {
        e.preventDefault();
        if (isRunning) {
          scoreboard.pauseClock(remainingSeconds);
        } else {
          scoreboard.startClock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, remainingSeconds, scoreboard, isCompleted]);

  // When Home Team dropdown changes in Add Modal
  const handleHomeTeamChange = (key) => {
    setAddHomeKey(key);
    if (key === 'custom') {
      const suggested = suggestTeamLineup(addHomeName);
      setAddHomeLineup(suggested);
    } else {
      const customMatch = customTeams.find(t => t.id === key);
      if (customMatch) {
        setAddHomeName(customMatch.name);
        if (customMatch.stadium) setAddVenue(customMatch.stadium);
        setAddHomeLineup(suggestTeamLineup(customMatch.name, customMatch.lineup));
      } else if (NHL_TEAMS[key]) {
        setAddHomeName(NHL_TEAMS[key].name);
        setAddVenue(NHL_TEAMS[key].stadium);
        setAddHomeLineup(getTeamLineup(key, NHL_TEAMS[key].name));
      }
    }
  };

  // When Away Team dropdown changes in Add Modal
  const handleAwayTeamChange = (key) => {
    setAddAwayKey(key);
    if (key === 'custom') {
      const suggested = suggestTeamLineup(addAwayName);
      setAddAwayLineup(suggested);
    } else {
      const customMatch = customTeams.find(t => t.id === key);
      if (customMatch) {
        setAddAwayName(customMatch.name);
        setAddAwayLineup(suggestTeamLineup(customMatch.name, customMatch.lineup));
      } else if (NHL_TEAMS[key]) {
        setAddAwayName(NHL_TEAMS[key].name);
        setAddAwayLineup(getTeamLineup(key, NHL_TEAMS[key].name));
      }
    }
  };

  // Submit Add Match
  const handleCreateMatchSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingAdd(true);

    try {
      let finalHomeId = addHomeKey;
      let finalHomeCrest = NHL_TEAMS[addHomeKey]?.crestSvg;
      const isHomeCustom = addHomeKey === 'custom' || addHomeKey.startsWith('custom-') || !NHL_TEAMS[addHomeKey];

      if (isHomeCustom && addHomeName) {
        const savedHome = saveCustomTeam({
          id: addHomeKey !== 'custom' ? addHomeKey : null,
          name: addHomeName,
          stadium: addVenue,
          crestSvg: customTeams.find(t => t.id === addHomeKey)?.crestSvg || generateTeamCrestSvg(addHomeName),
          lineup: addHomeLineup
        });
        if (savedHome) {
          finalHomeId = savedHome.id;
          finalHomeCrest = savedHome.crestSvg;
        }
      }

      let finalAwayId = addAwayKey;
      let finalAwayCrest = NHL_TEAMS[addAwayKey]?.crestSvg;
      const isAwayCustom = addAwayKey === 'custom' || addAwayKey.startsWith('custom-') || !NHL_TEAMS[addAwayKey];

      if (isAwayCustom && addAwayName) {
        const savedAway = saveCustomTeam({
          id: addAwayKey !== 'custom' ? addAwayKey : null,
          name: addAwayName,
          stadium: addVenue,
          crestSvg: customTeams.find(t => t.id === addAwayKey)?.crestSvg || generateTeamCrestSvg(addAwayName),
          lineup: addAwayLineup
        });
        if (savedAway) {
          finalAwayId = savedAway.id;
          finalAwayCrest = savedAway.crestSvg;
        }
      }

      const payload = {
        home: {
          id: finalHomeId,
          name: addHomeName || 'Home Team',
          score: parseInt(addHomeScore, 10) || 0,
          shots: 0,
          crestSvg: finalHomeCrest || generateTeamCrestSvg(addHomeName),
          lineup: addLineupsDeclared ? addHomeLineup : null
        },
        away: {
          id: finalAwayId,
          name: addAwayName || 'Away Team',
          score: parseInt(addAwayScore, 10) || 0,
          shots: 0,
          crestSvg: finalAwayCrest || generateTeamCrestSvg(addAwayName),
          lineup: addLineupsDeclared ? addAwayLineup : null
        },
        lineupsDeclared: addLineupsDeclared,
        venue: addVenue || 'Arena Stadium',
        date: addDate,
        dateTime: `${addDate} ${addTime}`,
        period: addPeriod,
        referee: addReferee,
        status: addPeriod === 'FT' ? 'Finished' : (addPeriod === 'UPCOMING' ? 'Upcoming' : 'Live'),
        statusBadge: addPeriod === 'FT' ? 'FT' : (addPeriod === 'UPCOMING' ? addTime : `P${addPeriod}`)
      };

      if (onAddMatch) {
        await onAddMatch(payload);
      }
      setCustomTeams(getCustomTeams());
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create match:', err);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Delete Match for chosen match ID
  const handleDeleteSelectedMatch = async (targetId) => {
    const idToDelete = targetId || selectedMatchToDelete;
    if (!idToDelete) return;
    if (matches.length <= 1) {
      alert('Cannot delete the only remaining match. At least one match is required.');
      return;
    }

    setIsSubmittingDelete(true);
    try {
      if (onDeleteMatch) {
        await onDeleteMatch(idToDelete);
      }
      setSelectedMatchToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete match:', err);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Chronological events array for active match
  const currentEvents = Array.isArray(matchState?.events) ? matchState.events : [];
  const filteredEvents = useMemo(() => {
    if (timelineFilter === 'goal') return currentEvents.filter(e => e.type === 'goal');
    if (timelineFilter === 'penalty') return currentEvents.filter(e => e.type === 'penalty');
    if (timelineFilter === 'shot') return currentEvents.filter(e => e.type === 'shot');
    return currentEvents;
  }, [currentEvents, timelineFilter]);

  // Open Quick Incident Logger (supports adding new or editing existing incident)
  const openIncidentLogger = (team = 'home', type = 'goal', existingIncident = null) => {
    if (existingIncident) {
      if (existingIncident.type === 'shot') {
        setShotTeam(existingIncident.team || team);
        setShotMinute(existingIncident.time || (isCompleted ? '15:00' : (formattedTime || '10:00')));
        setShotPeriod(existingIncident.period ? existingIncident.period.replace('P', '') : (matchState?.period || '1'));
        setShotPlayer(existingIncident.shotPlayer || existingIncident.player || '');
        setIsShotModalOpen(true);
        return;
      }
      setEditingIncidentId(existingIncident.id);
      setIncidentTeam(existingIncident.team || team);
      setIncidentType(existingIncident.type || type);
      setIncidentMinute(existingIncident.time || (isCompleted ? '15:00' : (formattedTime || '10:00')));
      setIncidentPeriod(existingIncident.period ? existingIncident.period.replace('P', '') : (matchState?.period || '1'));
      setIncidentPlayer(existingIncident.scorer || existingIncident.penaltyPlayer || existingIncident.shotPlayer || existingIncident.player || '');
      setIncidentAssist(existingIncident.assist || '');
      setIncidentPenaltyReason(existingIncident.penaltyReason || 'Tripping');
      setIncidentPenaltyMins(existingIncident.penaltyMin || 2);
      setIncidentGoalType(existingIncident.goalType || 'EV');
    } else {
      setEditingIncidentId(null);
      setIncidentTeam(team);
      setIncidentType(type);
      // Capture the exact clock time snapshot at the moment clicked
      const clickTime = isCompleted ? '15:00' : (formattedTime || '10:00');
      setIncidentMinute(clickTime);
      setIncidentPeriod(matchState?.period === 'FT' ? '3' : (matchState?.period || '1'));
      const activeLineup = team === 'home' ? homeLineup : awayLineup;
      setIncidentPlayer(activeLineup[1]?.name || activeLineup[0]?.name || '');
      setIncidentAssist(activeLineup[2]?.name || '');
      setIncidentPenaltyReason('Tripping');
      setIncidentPenaltyMins(2);
      setIncidentGoalType('EV');
    }
    setIsIncidentModalOpen(true);
  };

  // Open Shot Maker Modal to prompt for shooter
  const handleOpenAddShot = (team = 'home') => {
    setShotTeam(team);
    const clickTime = isCompleted ? '15:00' : (formattedTime || '10:00');
    setShotMinute(clickTime);
    setShotPeriod(matchState?.period === 'FT' ? '3' : (matchState?.period || '1'));
    const activeLineup = team === 'home' ? homeLineup : awayLineup;
    setShotPlayer(activeLineup[0]?.name || activeLineup[1]?.name || '');
    setIsShotModalOpen(true);
  };

  // Submit Shot on Goal with Shot Maker
  const handleSubmitShot = async (e) => {
    e.preventDefault();
    const periodLabel = `P${shotPeriod || matchState?.period || '1'}`;
    const timeLabel = shotMinute || formattedTime;
    const teamName = shotTeam === 'home' ? homeName : awayName;
    const currentTeamShots = (shotTeam === 'home' ? homeShots : awayShots) + 1;

    try {
      if (shotTeam === 'home') {
        scoreboard.incrementHomeShots();
      } else {
        scoreboard.incrementAwayShots();
      }

      if (scoreboard.addIncident) {
        await scoreboard.addIncident({
          time: timeLabel,
          period: periodLabel,
          team: shotTeam,
          type: 'shot',
          shotPlayer: shotPlayer || `${teamName} Shooter`,
          player: shotPlayer || `${teamName} Shooter`,
          shotsCount: currentTeamShots,
          text: `Shot on Goal by ${shotPlayer || `${teamName} Shooter`} (${teamName})`
        });
      }
    } catch (err) {
      console.error('Failed to submit shot:', err);
    } finally {
      setIsShotModalOpen(false);
    }
  };

  // Submit Incident Logger (Add or Edit)
  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    const periodLabel = `P${incidentPeriod || matchState?.period || '1'}`;
    const timeLabel = incidentMinute || formattedTime;
    const teamName = incidentTeam === 'home' ? homeName : awayName;

    try {
      if (editingIncidentId) {
        // Edit existing incident
        const updatedData = {
          time: timeLabel,
          period: periodLabel,
          team: incidentTeam,
          type: incidentType,
          ...(incidentType === 'goal' ? {
            scorer: incidentPlayer || `${teamName} Scorer`,
            assist: incidentAssist || '',
            goalType: incidentGoalType,
            text: `Goal! ${teamName} - ${incidentPlayer}`
          } : incidentType === 'shot' ? {
            shotPlayer: incidentPlayer || `${teamName} Shooter`,
            player: incidentPlayer || `${teamName} Shooter`,
            text: `Shot on Goal by ${incidentPlayer} (${teamName})`
          } : incidentType === 'penalty' ? {
            penaltyPlayer: incidentPlayer || `${teamName} Player`,
            penaltyMin: incidentPenaltyMins,
            penaltyReason: incidentPenaltyReason,
            text: `${incidentPenaltyMins} Min Penalty (${incidentPenaltyReason}) - ${incidentPlayer}`
          } : {
            text: `30-Second Timeout Called by ${teamName}`
          })
        };

        if (scoreboard.updateIncident) {
          await scoreboard.updateIncident(editingIncidentId, updatedData);
        }
      } else {
        // Create new incident
        if (incidentType === 'goal') {
          if (incidentTeam === 'home') {
            scoreboard.incrementHomeScore();
          } else {
            scoreboard.incrementAwayScore();
          }

          const newHomeScore = homeScore + (incidentTeam === 'home' ? 1 : 0);
          const newAwayScore = awayScore + (incidentTeam === 'away' ? 1 : 0);

          if (scoreboard.addIncident) {
            await scoreboard.addIncident({
              time: timeLabel,
              period: periodLabel,
              team: incidentTeam,
              type: 'goal',
              scorer: incidentPlayer || `${teamName} Forward`,
              assist: incidentAssist || '',
              goalType: incidentGoalType,
              score: `${newHomeScore} - ${newAwayScore}`,
              text: `Goal! ${teamName} (${newHomeScore} - ${newAwayScore})`
            });
          }
        } else if (incidentType === 'shot') {
          if (incidentTeam === 'home') {
            scoreboard.incrementHomeShots();
          } else {
            scoreboard.incrementAwayShots();
          }

          const currentTeamShots = (incidentTeam === 'home' ? homeShots : awayShots) + 1;
          if (scoreboard.addIncident) {
            await scoreboard.addIncident({
              time: timeLabel,
              period: periodLabel,
              team: incidentTeam,
              type: 'shot',
              shotPlayer: incidentPlayer || `${teamName} Shooter`,
              player: incidentPlayer || `${teamName} Shooter`,
              shotsCount: currentTeamShots,
              text: `Shot on Goal by ${incidentPlayer || `${teamName} Shooter`} (${teamName})`
            });
          }
        } else if (incidentType === 'penalty') {
          if (scoreboard.addIncident) {
            await scoreboard.addIncident({
              time: timeLabel,
              period: periodLabel,
              team: incidentTeam,
              type: 'penalty',
              penaltyPlayer: incidentPlayer || `${teamName} Player`,
              penaltyMin: incidentPenaltyMins,
              penaltyReason: incidentPenaltyReason,
              text: `${incidentPenaltyMins} Min Penalty (${incidentPenaltyReason}) - ${incidentPlayer}`
            });
          }
          if (scoreboard.setPowerPlay) {
            scoreboard.setPowerPlay(incidentTeam === 'home' ? 'away' : 'home');
          }
        } else if (incidentType === 'timeout') {
          if (scoreboard.addIncident) {
            await scoreboard.addIncident({
              time: timeLabel,
              period: periodLabel,
              team: incidentTeam,
              type: 'timeout',
              text: `30-Second Timeout Called by ${teamName}`
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to submit incident:', err);
    } finally {
      setIsIncidentModalOpen(false);
      setEditingIncidentId(null);
    }
  };

  // Delete an incident from timeline
  const handleDeleteIncident = async (incidentId, isGoal = false, isShot = false, team = 'home') => {
    if (!window.confirm('Are you sure you want to delete this incident from the timeline?')) {
      return;
    }
    try {
      if (scoreboard.deleteIncident) {
        await scoreboard.deleteIncident(incidentId, false);
      }
      if (isGoal) {
        if (team === 'home') scoreboard.decrementHomeScore();
        else scoreboard.decrementAwayScore();
      } else if (isShot) {
        if (team === 'home') scoreboard.decrementHomeShots();
        else scoreboard.decrementAwayShots();
      }
    } catch (err) {
      console.error('Failed to delete incident:', err);
    }
  };



  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Persistent Sticky Bar when scrolling - Always shows which match is being edited */}
      <div className="sticky top-2 z-40 bg-gray-950/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-gray-800 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] shrink-0 text-blue-400">
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-blue-500 animate-pulse'}`} />
            {isCompleted ? `Completed Match ${currentMatchNumber} of ${totalMatches}:` : `Editing Match ${currentMatchNumber} of ${totalMatches}:`}
          </span>
          <span className="font-extrabold text-white text-sm truncate">
            {homeName} <span className="text-blue-400 font-mono">({homeScore})</span> vs <span className="text-amber-400 font-mono">({awayScore})</span> {awayName}
          </span>
          <span className="text-gray-500 hidden md:inline">•</span>
          <span className="text-gray-300 font-medium text-[11px] hidden md:inline">
            {isCompleted ? (
              <span className="text-emerald-400 font-bold">Full Time (FT) • Final Score</span>
            ) : (
              `Period ${matchState?.period || '1'} • ${formattedTime}`
            )}
          </span>
          <span className="text-gray-500 hidden lg:inline">•</span>
          <span className="text-gray-400 text-[11px] hidden lg:inline truncate max-w-[150px]">
            {matchState?.venue || 'Arena'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {matches.length > 1 && (
            <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700/80 rounded-xl px-2.5 py-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">Switch:</span>
              <select
                value={matchState?.id || ''}
                onChange={(e) => onSelectMatch && onSelectMatch(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-100 outline-none cursor-pointer max-w-[160px] sm:max-w-[200px] truncate"
                title="Select active match to control"
              >
                {liveMatchesCount > 0 && (
                  <optgroup label={`Live Matches (${liveMatchesCount})`} className="bg-gray-900 text-red-400 font-bold">
                    {matches.filter(m => getMatchCategory(m) === 'live').map((m) => {
                      const idx = matches.findIndex(orig => orig.id === m.id);
                      return (
                        <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                          [LIVE] Match {idx + 1}: {m.home?.name || 'Home'} vs {m.away?.name || 'Away'} ({m.home?.score ?? 0}-{m.away?.score ?? 0})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {upcomingMatchesCount > 0 && (
                  <optgroup label={`Upcoming Matches (${upcomingMatchesCount})`} className="bg-gray-900 text-amber-400 font-bold">
                    {matches.filter(m => getMatchCategory(m) === 'upcoming').map((m) => {
                      const idx = matches.findIndex(orig => orig.id === m.id);
                      return (
                        <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                          [UPCOMING] Match {idx + 1}: {m.home?.name || 'Home'} vs {m.away?.name || 'Away'}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {finishedMatchesCount > 0 && (
                  <optgroup label={`Finished Matches (${finishedMatchesCount})`} className="bg-gray-900 text-emerald-400 font-bold">
                    {matches.filter(m => getMatchCategory(m) === 'finished').map((m) => {
                      const idx = matches.findIndex(orig => orig.id === m.id);
                      return (
                        <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                          [FT] Match {idx + 1}: {m.home?.name || 'Home'} vs {m.away?.name || 'Away'} ({m.home?.score ?? 0}-{m.away?.score ?? 0})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSwitchModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-200 text-xs font-bold border border-gray-700 transition-colors cursor-pointer shrink-0"
          >
            <span>Switch Match</span>
          </button>
        </div>
      </div>

      {/* Top Navigation Bar with Clear Match Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToScoreboard}
            className="text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <span>Back to Scoreboard</span>
          </button>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Live Operator Console • Match {currentMatchNumber} of {totalMatches}
            </div>
            <div className="text-sm text-gray-900 font-extrabold truncate">
              {homeName} vs {awayName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter for Matches */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Status:</span>
            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
              title="Filter matches by status"
            >
              <option value="all">All Matches ({matches.length})</option>
              <option value="live">Live Matches ({liveMatchesCount})</option>
              <option value="upcoming">Upcoming Matches ({upcomingMatchesCount})</option>
              <option value="finished">Finished Matches ({finishedMatchesCount})</option>
            </select>
          </div>

          {/* Active Match Dropdown */}
          {matches.length > 1 && (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Active Match:</span>
              <select
                value={matchState?.id || ''}
                onChange={(e) => onSelectMatch && onSelectMatch(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
                title="Select active match to control"
              >
                {matchFilter === 'all' ? (
                  <>
                    {liveMatchesCount > 0 && (
                      <optgroup label={`Live Matches (${liveMatchesCount})`}>
                        {matches.filter(m => getMatchCategory(m) === 'live').map((m) => {
                          const idx = matches.findIndex(orig => orig.id === m.id);
                          return (
                            <option key={m.id} value={m.id}>
                              Match {idx + 1}: {m.home?.name || 'Home'} vs {m.away?.name || 'Away'} ({m.home?.score ?? 0} - {m.away?.score ?? 0})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {upcomingMatchesCount > 0 && (
                      <optgroup label={`Upcoming Matches (${upcomingMatchesCount})`}>
                        {matches.filter(m => getMatchCategory(m) === 'upcoming').map((m) => {
                          const idx = matches.findIndex(orig => orig.id === m.id);
                          return (
                            <option key={m.id} value={m.id}>
                              Match {idx + 1}: {m.home?.name || 'Home'} vs {m.away?.name || 'Away'}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {finishedMatchesCount > 0 && (
                      <optgroup label={`Finished Matches (${finishedMatchesCount})`}>
                        {matches.filter(m => getMatchCategory(m) === 'finished').map((m) => {
                          const idx = matches.findIndex(orig => orig.id === m.id);
                          return (
                            <option key={m.id} value={m.id}>
                              Match {idx + 1}: {m.home?.name || 'Home'} vs {m.away?.name || 'Away'} ({m.home?.score ?? 0} - {m.away?.score ?? 0}) [FT]
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </>
                ) : (
                  <>
                    {!filteredMatchesList.some(m => m.id === matchState?.id) && matchState && (
                      <option value={matchState.id} disabled>
                        [Current] {homeName} vs {awayName}
                      </option>
                    )}
                    {filteredMatchesList.map((m) => {
                      const idx = matches.findIndex(orig => orig.id === m.id);
                      const cat = getMatchCategory(m);
                      return (
                        <option key={m.id} value={m.id}>
                          Match {idx + 1}: {m.home?.name || 'Home'} vs {m.away?.name || 'Away'} {cat === 'upcoming' ? '' : `(${m.home?.score ?? 0} - {m.away?.score ?? 0})`}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSwitchModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold border border-gray-200 transition-colors cursor-pointer"
            title="Browse and switch matches"
          >
            <span>Switch Match...</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 hover:border-red-200 cursor-pointer"
            >
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. JUMBOTRON MASTER MATCH BANNER */}
      <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 mb-6 relative overflow-hidden">
        {/* Arena Glow FX */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Strip with Prominent Match Identification */}
        <div className="pb-4 mb-4 border-b border-gray-800/80">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-extrabold uppercase tracking-wider text-[11px] border border-blue-500/30">
                {isCompleted ? `COMPLETED MATCH ${currentMatchNumber} OF ${totalMatches}` : `ACTIVE MATCH ${currentMatchNumber} OF ${totalMatches}`}
              </span>
              <span className="text-gray-600">•</span>
              <span className="font-mono font-bold tracking-wider uppercase text-gray-300">
                {isCompleted ? 'FULL TIME (FINISHED)' : (isRunning ? 'BROADCAST CLOCK RUNNING' : 'ARENA CLOCK PAUSED')}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 font-medium">{matchState?.venue || 'United Center'}</span>
            </div>

            {/* Action buttons: Switch Match, Add Match, Delete Match */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSwitchModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold border border-gray-700 transition-colors cursor-pointer"
                title="Switch active match"
              >
                <span>Switch Match</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                title="Create new match"
              >
                <span>Add Match</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMatchToDelete(matchState?.id || (matches[0] && matches[0].id));
                  setIsDeleteModalOpen(true);
                }}
                disabled={matches.length <= 1}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800/60 disabled:opacity-30 transition-colors cursor-pointer"
                title="Open Delete Match pop-up"
              >
                <span>Delete Match</span>
              </button>
            </div>
          </div>

          <div className="bg-black/40 rounded-xl px-4 py-2 border border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">Currently Editing:</span>
              <span className="text-white font-extrabold text-sm">{homeName} vs {awayName}</span>
              <span className="text-gray-500 font-mono text-[11px]">(ID: {matchState?.id || 'active'})</span>
            </div>
            <div className="text-gray-400 text-[11px] flex items-center gap-2">
              <span>{matchState?.date || 'Scheduled'}</span>
              <span>•</span>
              <span className="text-blue-400 font-bold">{isCompleted ? 'Finished (Full Time)' : (matchState?.status || `Period ${matchState?.period || '1'}`)}</span>
            </div>
          </div>
        </div>

        {/* Jumbotron Matchup Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
          {/* Home Team */}
          <div className="flex items-center justify-start md:justify-end gap-4 text-left md:text-right min-w-0">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">
                HOME TEAM {!isCompleted && matchState?.powerPlay === 'home' && <span className="ml-1 text-amber-300 font-extrabold">• POWER PLAY</span>}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate max-w-[200px]">
                {homeName}
              </h2>
              <div className="text-xs text-gray-400 mt-1 font-mono">
                SOG: <strong className="text-gray-100 font-bold">{homeShots}</strong>
              </div>
            </div>
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center drop-shadow-md"
              dangerouslySetInnerHTML={{ __html: homeCrest }}
            />
          </div>

          {/* Central Big Score & Clock */}
          <div className="flex flex-col items-center justify-center text-center px-4 py-3 bg-black/40 rounded-2xl border border-gray-800">
            <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-white flex items-center gap-3">
              <span>{homeScore}</span>
              <span className="text-gray-600 font-light text-4xl">-</span>
              <span>{awayScore}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isCompleted ? (
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Final Score • Full Time (FT)
                </span>
              ) : (
                <>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Period {matchState?.period || '1'}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="font-mono text-xs font-bold text-gray-300 tracking-wider">
                    {formattedTime}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-start gap-4 text-left min-w-0">
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center drop-shadow-md"
              dangerouslySetInnerHTML={{ __html: awayCrest }}
            />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                AWAY TEAM {!isCompleted && matchState?.powerPlay === 'away' && <span className="ml-1 text-amber-300 font-extrabold">• POWER PLAY</span>}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate max-w-[200px]">
                {awayName}
              </h2>
              <div className="text-xs text-gray-400 mt-1 font-mono">
                SOG: <strong className="text-gray-100 font-bold">{awayShots}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Console Mode Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6 border border-gray-200">
        <button
          onClick={() => setConsoleTab('operator')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            consoleTab === 'operator'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>Live Operator Console</span>
        </button>

        <button
          onClick={() => setConsoleTab('admin')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            consoleTab === 'admin'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>Admin Master Controls (Time, Score, Schedule)</span>
          {isAdmin && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded-md">
              ADMIN
            </span>
          )}
        </button>
      </div>

      {consoleTab === 'admin' ? (
        <div className="space-y-6">
          <AdminPanel
            matchState={matchState}
            scoreboard={scoreboard}
            remainingSeconds={remainingSeconds}
            isRunning={isRunning}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 3. PRECISION GAME CLOCK CONTROLS (Removed for completed match) */}
          {isCompleted ? (
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-sm shrink-0">
                  FT
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">Match Completed (Full Time)</h3>
                    <span className="text-[11px] text-emerald-600 font-extrabold uppercase">● Final</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Game timer and clock controls are removed for completed fixtures. Only editing of the final score and timeline incidents is enabled.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => scoreboard.setPeriod('3')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                title="Reopen match as Live in Period 3"
              >
                <span>Reopen Match as Live (Period 3)</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-700" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Game Clock Control</h3>
                    <p className="text-[11px] text-gray-400">Match {currentMatchNumber} of {totalMatches} • {homeName} vs {awayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-gray-400 hidden sm:inline">
                    Shortcut: <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono text-[10px]">Space</kbd> Start/Pause
                  </span>
                  <span className={`text-xs font-bold tracking-wide ${
                    isRunning ? 'text-emerald-600 font-mono' : 'text-gray-400'
                  }`}>
                    {isRunning ? 'COUNTING DOWN' : 'PAUSED'}
                  </span>
                </div>
              </div>

              {/* Big Clock Display */}
              <div className="text-center py-5 bg-gradient-to-b from-gray-900 to-slate-900 text-white rounded-2xl border border-gray-800 mb-6 shadow-inner">
                <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-white drop-shadow-md">
                  {formattedTime}
                </div>
                <div className="text-xs font-semibold text-gray-400 mt-2 uppercase tracking-wider flex items-center justify-center gap-2">
                  <span>Period {matchState?.period || '1'}</span>
                  <span>•</span>
                  <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                    {isRunning ? 'Live Game Action' : 'Clock Stopped'}
                  </span>
                </div>
              </div>

              {/* Main Action Buttons: Start/Pause & Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={() => scoreboard.pauseClock(remainingSeconds)}
                    className="col-span-2 sm:col-span-2 flex items-center justify-center gap-2 py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-base shadow-md shadow-amber-500/20 transition-all active:scale-98 cursor-pointer"
                  >
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause Clock</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={scoreboard.startClock}
                    className="col-span-2 sm:col-span-2 flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base shadow-md shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Start Clock</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => scoreboard.resetClock(1200)}
                  className="flex items-center justify-center gap-1.5 py-4 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-xs transition-all active:scale-98 cursor-pointer"
                  title="Reset to 20:00 regulation period"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>20:00 (Period)</span>
                </button>

                <button
                  type="button"
                  onClick={() => scoreboard.resetClock(300)}
                  className="flex items-center justify-center gap-1.5 py-4 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-xs transition-all active:scale-98 cursor-pointer"
                  title="Reset to 5:00 Overtime"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>5:00 (Overtime)</span>
                </button>
              </div>

              {/* Period Quick Presets & Fine Tuning */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Presets:</span>
                  <button
                    type="button"
                    onClick={() => scoreboard.resetClock(900)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 cursor-pointer"
                  >
                    15:00 Int.
                  </button>
                  <button
                    type="button"
                    onClick={() => scoreboard.resetClock(120)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 cursor-pointer"
                  >
                    2:00 Minor
                  </button>
                  <button
                    type="button"
                    onClick={() => scoreboard.resetClock(60)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 cursor-pointer"
                  >
                    1:00 Final
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Adjust:</span>
                  <button
                    type="button"
                    onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, 60)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                  >
                    +1m
                  </button>
                  <button
                    type="button"
                    onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, -60)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                  >
                    -1m
                  </button>
                  <button
                    type="button"
                    onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, 10)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                  >
                    +10s
                  </button>
                  <button
                    type="button"
                    onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, -10)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                  >
                    -10s
                  </button>
                  <button
                    type="button"
                    onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, 1)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                  >
                    +1s
                  </button>
                  <button
                    type="button"
                    onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, -1)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                  >
                    -1s
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. DUAL TEAM STATIONS: GOALS / SCORE EDITING */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {isCompleted ? 'Final Match Score Editing' : 'Team Scoring & Shot Control'}
                </h3>
                <p className="text-xs text-gray-400">
                  {isCompleted
                    ? `Editing official final scores for ${homeName} and ${awayName}`
                    : `Controlling scores for ${homeName} vs ${awayName}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openIncidentLogger('home', 'goal')}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>+ Log Event</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HOME TEAM STATION */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      HOME STATION: {homeName}
                    </span>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => scoreboard.setPowerPlay && scoreboard.setPowerPlay('home')}
                        className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          matchState?.powerPlay === 'home'
                            ? 'text-amber-500 underline underline-offset-2'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {matchState?.powerPlay === 'home' ? 'Power Play Active' : 'Toggle Power Play'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 shrink-0 flex items-center justify-center drop-shadow-xs"
                      dangerouslySetInnerHTML={{ __html: homeCrest }}
                    />
                    <h4 className="text-xl font-bold text-gray-900 truncate">
                      {homeName}
                    </h4>
                  </div>

                  {/* Giant Score Display */}
                  <div className="text-center my-4 py-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <div className="text-7xl font-black text-gray-900 font-mono tracking-tight">
                      {homeScore}
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {isCompleted ? 'Final Goals' : 'Goals'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-100">
                  {/* Goal Increment / Decrement */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={scoreboard.decrementHomeScore}
                      className="py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      title="Subtract 1 goal"
                    >
                      <Minus className="w-5 h-5" />
                      <span className="text-xs">Goal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openIncidentLogger('home', 'goal')}
                      className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      title="Add 1 goal (prompts for scorer & exact time)"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs">+1 Goal</span>
                    </button>
                  </div>

                  {/* Shots on Goal Control (Live match only) */}
                  {!isCompleted && (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-600">
                        Shots on Goal: <strong className="text-gray-900">{homeShots}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={scoreboard.decrementHomeShots}
                          className="w-7 h-7 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700 cursor-pointer"
                          title="Subtract 1 shot"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAddShot('home')}
                          className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center font-bold cursor-pointer"
                          title="Add shot on goal (prompts for shot maker)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Incident Button */}
                  <button
                    type="button"
                    onClick={() => openIncidentLogger('home', 'goal')}
                    className="w-full py-2 bg-gray-50 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <span>+ Log Goal with Scorer Roster</span>
                  </button>
                </div>
              </div>

              {/* AWAY TEAM STATION */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      AWAY STATION: {awayName}
                    </span>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => scoreboard.setPowerPlay && scoreboard.setPowerPlay('away')}
                        className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          matchState?.powerPlay === 'away'
                            ? 'text-amber-500 underline underline-offset-2'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {matchState?.powerPlay === 'away' ? 'Power Play Active' : 'Toggle Power Play'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 shrink-0 flex items-center justify-center drop-shadow-xs"
                      dangerouslySetInnerHTML={{ __html: awayCrest }}
                    />
                    <h4 className="text-xl font-bold text-gray-900 truncate">
                      {awayName}
                    </h4>
                  </div>

                  {/* Giant Score Display */}
                  <div className="text-center my-4 py-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <div className="text-7xl font-black text-gray-900 font-mono tracking-tight">
                      {awayScore}
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {isCompleted ? 'Final Goals' : 'Goals'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-100">
                  {/* Goal Increment / Decrement */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={scoreboard.decrementAwayScore}
                      className="py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      title="Subtract 1 goal"
                    >
                      <Minus className="w-5 h-5" />
                      <span className="text-xs">Goal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openIncidentLogger('away', 'goal')}
                      className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      title="Add 1 goal (prompts for scorer & exact time)"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs">+1 Goal</span>
                    </button>
                  </div>

                  {/* Shots on Goal Control (Live match only) */}
                  {!isCompleted && (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-600">
                        Shots on Goal: <strong className="text-gray-900">{awayShots}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={scoreboard.decrementAwayShots}
                          className="w-7 h-7 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700 cursor-pointer"
                          title="Subtract 1 shot"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAddShot('away')}
                          className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold cursor-pointer"
                          title="Add shot on goal (prompts for shot maker)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Incident Button */}
                  <button
                    type="button"
                    onClick={() => openIncidentLogger('away', 'goal')}
                    className="w-full py-2 bg-gray-50 hover:bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-dashed border-gray-300 hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    <span>+ Log Goal with Scorer Roster</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. LIVE MATCH TIMELINE & INCIDENTS (ADMIN CONTROL) */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Live Match Timeline & Incidents</h3>
                  <span className="text-xs text-blue-600 font-extrabold uppercase">● Admin Live Setting</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set live goal scorers, assists, penalties, and timeouts for {homeName} vs {awayName}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openIncidentLogger('home', 'goal')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>+ Log Goal Scorer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddShot('home')}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>+ Log Shot Maker</span>
                </button>
                <button
                  type="button"
                  onClick={() => openIncidentLogger('home', 'penalty')}
                  className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>+ Log Penalty</span>
                </button>
                <button
                  type="button"
                  onClick={() => openIncidentLogger('home', 'timeout')}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold border border-gray-200 transition-colors cursor-pointer"
                >
                  <span>+ Timeout</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Event Count */}
            <div className="flex items-center justify-between mb-4 text-xs font-semibold">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTimelineFilter('all')}
                  className={`py-1 transition-colors cursor-pointer ${
                    timelineFilter === 'all'
                      ? 'text-gray-900 border-b-2 border-gray-900 font-black'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  All ({currentEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter('goal')}
                  className={`py-1 transition-colors cursor-pointer ${
                    timelineFilter === 'goal'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-black'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Goals ({currentEvents.filter(e => e.type === 'goal').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter('shot')}
                  className={`py-1 transition-colors cursor-pointer ${
                    timelineFilter === 'shot'
                      ? 'text-sky-600 border-b-2 border-sky-600 font-black'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Shots ({currentEvents.filter(e => e.type === 'shot').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter('penalty')}
                  className={`py-1 transition-colors cursor-pointer ${
                    timelineFilter === 'penalty'
                      ? 'text-gray-900 border-b-2 border-gray-900 font-black'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Penalties ({currentEvents.filter(e => e.type === 'penalty').length})
                </button>
              </div>

              <span className="text-[11px] text-gray-400">
                Sorted by most recent
              </span>
            </div>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
              <div className="p-8 bg-gray-50/70 rounded-2xl border border-gray-100 text-center text-xs">
                <span className="text-gray-400 font-semibold block mb-1">NO TIMELINE INCIDENTS RECORDED YET</span>
                <p className="text-gray-500 max-w-sm mx-auto mb-3">
                  Click "+ Log Goal Scorer", "+ Log Shot Maker", or "+ Log Penalty" to set live timeline events for this match.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openIncidentLogger('home', 'goal')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 cursor-pointer"
                  >
                    + Goal for {homeName}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddShot('home')}
                    className="px-3 py-1.5 bg-sky-50 text-sky-700 font-bold rounded-lg hover:bg-sky-100 cursor-pointer"
                  >
                    + Shot for {homeName}
                  </button>
                  <button
                    type="button"
                    onClick={() => openIncidentLogger('away', 'goal')}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold rounded-lg hover:bg-amber-100 cursor-pointer"
                  >
                    + Goal for {awayName}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddShot('away')}
                    className="px-3 py-1.5 bg-amber-50 text-amber-800 font-bold rounded-lg hover:bg-amber-100 cursor-pointer"
                  >
                    + Shot for {awayName}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredEvents.map((evt) => {
                  const isGoal = evt.type === 'goal';
                  const isPenalty = evt.type === 'penalty';
                  const isShot = evt.type === 'shot';
                  const isHome = evt.team === 'home';
                  const evtTeamName = isHome ? homeName : awayName;

                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Time & Period */}
                        <div className="text-center w-14 shrink-0 bg-gray-100 py-1 px-1.5 rounded-xl">
                          <span className="font-mono text-xs font-bold text-gray-800 block leading-tight">{evt.time || '00:00'}</span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">{evt.period || 'P1'}</span>
                        </div>

                        {/* Event Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-black uppercase tracking-wider ${
                              isGoal ? (isHome ? 'text-blue-600' : 'text-amber-600') : isShot ? 'text-sky-600' : isPenalty ? 'text-gray-800' : 'text-purple-600'
                            }`}>
                              {isGoal ? 'Goal' : isShot ? 'Shot on Goal' : isPenalty ? `${evt.penaltyMin || 2} Min Penalty` : 'Timeout'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {isGoal ? evt.scorer : isShot ? (evt.shotPlayer || evt.player) : isPenalty ? evt.penaltyPlayer : evtTeamName}
                            </span>
                            {evt.score && (
                              <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                {evt.score}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-2">
                            <span className="font-medium text-gray-700">{evtTeamName}</span>
                            {isGoal && evt.assist && (
                              <>
                                <span>•</span>
                                <span>Assist: <strong className="text-gray-700">{evt.assist}</strong></span>
                              </>
                            )}
                            {isShot && (
                              <>
                                <span>•</span>
                                <span>Shot Maker: <strong className="text-gray-700">{evt.shotPlayer || evt.player}</strong></span>
                              </>
                            )}
                            {isPenalty && (
                              <>
                                <span>•</span>
                                <span>Infraction: <strong className="text-gray-700">{evt.penaltyReason || 'Tripping'}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit and Delete Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openIncidentLogger(evt.team, evt.type, evt)}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit this incident"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIncident(evt.id, isGoal, isShot, evt.team)}
                          className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this incident"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. PERIOD & GAME STATE SWITCHER */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {isCompleted ? 'Match Status: Finished (Full Time)' : 'Period & Game State Selection'}
                </h3>
                <p className="text-xs text-gray-400">
                  {isCompleted
                    ? 'Match is closed at Full Time. Select an active period (1, 2, 3, OT) to reopen live game tracking.'
                    : 'Switch game period or conclude match at Full Time.'}
                </p>
              </div>
              {isCompleted && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                  Completed Match
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['1', '2', '3', 'OT', 'SO', 'FT'].map((periodKey) => {
                const isSelected = String(matchState?.period) === periodKey;
                const label = periodKey === 'FT' ? 'Full Time' : periodKey === 'OT' ? 'Overtime' : periodKey === 'SO' ? 'Shootout' : `Period ${periodKey}`;
                return (
                  <button
                    key={periodKey}
                    type="button"
                    onClick={() => scoreboard.setPeriod(periodKey)}
                    className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* --- MODAL 1: ADD MATCH MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="mb-5 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Add New Hockey Match
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Create a fixture to broadcast on the public scoreboard and operate in real time
              </p>
            </div>

            <form onSubmit={handleCreateMatchSubmit} className="space-y-4">
              {/* Home Team Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Home Team
                  </label>
                  {customTeams.some(t => t.id === addHomeKey) && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteCustomTeam(addHomeKey);
                        setCustomTeams(getCustomTeams());
                        handleHomeTeamChange('blackhawks');
                      }}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Delete Remembered Team
                    </button>
                  )}
                </div>
                <select
                  value={addHomeKey}
                  onChange={(e) => handleHomeTeamChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none mb-2 cursor-pointer"
                >
                  <optgroup label="Official NHL Teams">
                    {Object.entries(NHL_TEAMS).map(([key, team]) => (
                      <option key={key} value={key}>
                        {team.name} ({team.stadium})
                      </option>
                    ))}
                  </optgroup>
                  {customTeams.length > 0 && (
                    <optgroup label="Admin Created Teams (Remembered)">
                      {customTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.stadium || 'Custom Venue'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="custom">+ Create New Custom Team...</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    value={addHomeName}
                    onChange={(e) => setAddHomeName(e.target.value)}
                    placeholder="Home Team Name"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                    required
                  />
                  {addHomeKey === 'custom' && (
                    <button
                      type="button"
                      onClick={() => setAddHomeLineup(suggestTeamLineup(addHomeName))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Suggest Lineup
                    </button>
                  )}
                </div>
              </div>

              {/* Away Team Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Away Team
                  </label>
                  {customTeams.some(t => t.id === addAwayKey) && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteCustomTeam(addAwayKey);
                        setCustomTeams(getCustomTeams());
                        handleAwayTeamChange('penguins');
                      }}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Delete Remembered Team
                    </button>
                  )}
                </div>
                <select
                  value={addAwayKey}
                  onChange={(e) => handleAwayTeamChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none mb-2 cursor-pointer"
                >
                  <optgroup label="Official NHL Teams">
                    {Object.entries(NHL_TEAMS).map(([key, team]) => (
                      <option key={key} value={key}>
                        {team.name}
                      </option>
                    ))}
                  </optgroup>
                  {customTeams.length > 0 && (
                    <optgroup label="Admin Created Teams (Remembered)">
                      {customTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="custom">+ Create New Custom Team...</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    value={addAwayName}
                    onChange={(e) => setAddAwayName(e.target.value)}
                    placeholder="Away Team Name"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                    required
                  />
                  {addAwayKey === 'custom' && (
                    <button
                      type="button"
                      onClick={() => setAddAwayLineup(suggestTeamLineup(addAwayName))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-amber-600 hover:text-amber-800 font-semibold cursor-pointer"
                    >
                      Suggest Lineup
                    </button>
                  )}
                </div>
              </div>

              {/* Venue & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Arena / Venue
                  </label>
                  <input
                    type="text"
                    value={addVenue}
                    onChange={(e) => setAddVenue(e.target.value)}
                    placeholder="e.g. United Center"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Match Date
                  </label>
                  <input
                    type="text"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    placeholder="Wed, Oct 14, 2026"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Puck Drop Time & Period/Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Puck Drop Time
                  </label>
                  <input
                    type="text"
                    value={addTime}
                    onChange={(e) => setAddTime(e.target.value)}
                    placeholder="19:00"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Match Status
                  </label>
                  <select
                    value={addPeriod}
                    onChange={(e) => setAddPeriod(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="1">Period 1 (Live)</option>
                    <option value="2">Period 2 (Live)</option>
                    <option value="3">Period 3 (Live)</option>
                    <option value="OT">Overtime</option>
                    <option value="SO">Shootout</option>
                    <option value="UPCOMING">Upcoming / Scheduled</option>
                    <option value="FT">Finished (Full Time)</option>
                  </select>
                </div>
              </div>

              {/* Initial Scores & Referee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Home Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addHomeScore}
                    onChange={(e) => setAddHomeScore(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Away Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addAwayScore}
                    onChange={(e) => setAddAwayScore(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Head Referee
                  </label>
                  <input
                    type="text"
                    value={addReferee}
                    onChange={(e) => setAddReferee(e.target.value)}
                    placeholder="Furlatt E."
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Lineup Declaration Section */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Starting Lineups & Rosters
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Declare the 6 starting players, or leave as "Not Declared"
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addLineupsDeclared}
                      onChange={(e) => setAddLineupsDeclared(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-700">
                      {addLineupsDeclared ? 'Lineups Declared' : 'Not Declared'}
                    </span>
                  </label>
                </div>

                {addLineupsDeclared ? (
                  <div className="space-y-3 pt-2">
                    {/* Home Starters */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-blue-800">
                          {addHomeName} Starters ({addHomeLineup.length} Players)
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setAddHomeLineup(suggestTeamLineup(addHomeName))}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                            title="Generate intelligent starter suggestions for this team"
                          >
                            Suggest Lineup
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddHomeLineup(getTeamLineup(addHomeKey, addHomeName))}
                            className="text-[11px] text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                            title="Reset to team's saved or default roster"
                          >
                            Reset Roster
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {addHomeLineup.map((player, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-xl border border-gray-200 text-xs shadow-2xs">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold mb-1.5">
                              <select
                                value={player.pos}
                                onChange={(e) => {
                                  const copy = [...addHomeLineup];
                                  copy[idx] = { ...copy[idx], pos: e.target.value };
                                  setAddHomeLineup(copy);
                                }}
                                className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
                              >
                                <option value="G">G</option>
                                <option value="C">C</option>
                                <option value="LW">LW</option>
                                <option value="RW">RW</option>
                                <option value="D">D</option>
                              </select>
                              <div className="flex items-center gap-0.5 text-gray-500">
                                <span>#</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={player.number}
                                  onChange={(e) => {
                                    const copy = [...addHomeLineup];
                                    copy[idx] = { ...copy[idx], number: parseInt(e.target.value, 10) || 1 };
                                    setAddHomeLineup(copy);
                                  }}
                                  className="w-7 font-mono font-bold text-gray-700 outline-none bg-transparent text-right"
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) => {
                                const copy = [...addHomeLineup];
                                copy[idx] = { ...copy[idx], name: e.target.value };
                                setAddHomeLineup(copy);
                              }}
                              className="w-full font-semibold text-gray-800 text-xs outline-none bg-transparent"
                              placeholder="Player Name"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Away Starters */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-amber-800">
                          {addAwayName} Starters ({addAwayLineup.length} Players)
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setAddAwayLineup(suggestTeamLineup(addAwayName))}
                            className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold cursor-pointer"
                            title="Generate intelligent starter suggestions for this team"
                          >
                            Suggest Lineup
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddAwayLineup(getTeamLineup(addAwayKey, addAwayName))}
                            className="text-[11px] text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                            title="Reset to team's saved or default roster"
                          >
                            Reset Roster
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {addAwayLineup.map((player, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-xl border border-gray-200 text-xs shadow-2xs">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold mb-1.5">
                              <select
                                value={player.pos}
                                onChange={(e) => {
                                  const copy = [...addAwayLineup];
                                  copy[idx] = { ...copy[idx], pos: e.target.value };
                                  setAddAwayLineup(copy);
                                }}
                                className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
                              >
                                <option value="G">G</option>
                                <option value="C">C</option>
                                <option value="LW">LW</option>
                                <option value="RW">RW</option>
                                <option value="D">D</option>
                              </select>
                              <div className="flex items-center gap-0.5 text-gray-500">
                                <span>#</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={player.number}
                                  onChange={(e) => {
                                    const copy = [...addAwayLineup];
                                    copy[idx] = { ...copy[idx], number: parseInt(e.target.value, 10) || 1 };
                                    setAddAwayLineup(copy);
                                  }}
                                  className="w-7 font-mono font-bold text-gray-700 outline-none bg-transparent text-right"
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) => {
                                const copy = [...addAwayLineup];
                                copy[idx] = { ...copy[idx], name: e.target.value };
                                setAddAwayLineup(copy);
                              }}
                              className="w-full font-semibold text-gray-800 text-xs outline-none bg-transparent"
                              placeholder="Player Name"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Lineup Status: Not Declared.</span>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      The match will display "Lineup Not Declared" until rosters are declared.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <span>{isSubmittingAdd ? 'Creating...' : 'Create Match'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: SELECT & DELETE MATCH POP-UP MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Delete Match
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select a match from the list below to delete it from the scoreboard
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Match List to Select from */}
            <div className="py-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
              {matches && matches.length > 0 ? (
                matches.map((m) => {
                  const isSelected = (selectedMatchToDelete || matchState?.id) === m.id;
                  const isCurrentActive = m.id === matchState?.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMatchToDelete(m.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-red-500 bg-red-50/40 ring-1 ring-red-500/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Radio selection indicator */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-red-600 bg-red-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm truncate">
                              {m.home?.name || 'Home'} <span className="font-black text-gray-800">({m.home?.score ?? 0} - {m.away?.score ?? 0})</span> {m.away?.name || 'Away'}
                            </span>
                            {isCurrentActive && (
                              <span className="text-blue-600 font-extrabold text-[11px] shrink-0 uppercase tracking-wide">
                                ● Active In Remote
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                            <span>{m.venue || 'Arena'}</span>
                            <span>•</span>
                            <span>{m.period === 'FT' ? 'Finished' : (m.period === 'UPCOMING' ? 'Upcoming' : `Period ${m.period}`)}</span>
                            {m.date && (
                              <>
                                <span>•</span>
                                <span>{m.date}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Delete button per row */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSelectedMatch(m.id);
                        }}
                        disabled={isSubmittingDelete || matches.length <= 1}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold border border-red-200 hover:border-red-600 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Delete this match"
                      >
                        <span>Delete</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No matches available.
                </div>
              )}
            </div>

            {matches.length <= 1 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-3">
                Cannot delete the only remaining match. At least one match is required.
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSelectedMatch(selectedMatchToDelete || matchState?.id)}
                disabled={isSubmittingDelete || matches.length <= 1 || !(selectedMatchToDelete || matchState?.id)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <span>{isSubmittingDelete ? 'Deleting...' : 'Delete Selected Match'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: SWITCH ACTIVE MATCH MODAL WITH STATUS FILTERS --- */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Select Match to Control
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Filter by status and select which fixture to manage in the Remote Control console
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSwitchModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Status Filter Tabs (Square/Rounded-xl tabs, no pill capsules) */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 rounded-2xl mt-4">
              <button
                type="button"
                onClick={() => setMatchFilter('all')}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  matchFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({matches.length})
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('live')}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  matchFilter === 'live'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-red-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${matchFilter === 'live' ? 'bg-white' : 'bg-red-500'} animate-pulse`} />
                Live ({liveMatchesCount})
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('upcoming')}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  matchFilter === 'upcoming'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-600 hover:text-amber-700'
                }`}
              >
                Upcoming ({upcomingMatchesCount})
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('finished')}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  matchFilter === 'finished'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                Finished ({finishedMatchesCount})
              </button>
            </div>

            {/* Filtered Matches List */}
            <div className="py-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
              {filteredMatchesList && filteredMatchesList.length > 0 ? (
                filteredMatchesList.map((m, idx) => {
                  const isCurrentActive = m.id === matchState?.id;
                  const category = getMatchCategory(m);
                  const originalIndex = matches.findIndex(orig => orig.id === m.id);

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        if (onSelectMatch) onSelectMatch(m.id);
                        setIsSwitchModalOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrentActive
                          ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-gray-400">
                            Match {originalIndex >= 0 ? originalIndex + 1 : idx + 1}:
                          </span>

                          {/* Status Badge */}
                          {category === 'live' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                              Live P{m.period || '1'}
                            </span>
                          )}
                          {category === 'upcoming' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                              ⏰ Upcoming
                            </span>
                          )}
                          {category === 'finished' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                              🏁 Finished (FT)
                            </span>
                          )}

                          <span className="font-bold text-gray-900 text-sm truncate">
                            {m.home?.name || 'Home'}
                            {category !== 'upcoming' && (
                              <span className="font-black text-gray-800"> ({m.home?.score ?? 0} - {m.away?.score ?? 0}) </span>
                            )}
                            {category === 'upcoming' && (
                              <span className="text-gray-400 font-medium"> vs </span>
                            )}
                            {m.away?.name || 'Away'}
                          </span>

                          {isCurrentActive && (
                            <span className="text-blue-600 font-extrabold text-[11px] shrink-0 uppercase tracking-wide">
                              ● Currently Editing
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>{m.venue || 'Arena'}</span>
                          <span>•</span>
                          <span>
                            {category === 'finished'
                              ? 'Full Time (FT) • Final Score'
                              : (category === 'upcoming'
                                  ? (m.dateTime || m.date || 'Scheduled')
                                  : `Period ${m.period || '1'}`)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                          isCurrentActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700'
                        }`}
                      >
                        <span>{isCurrentActive ? 'Active' : 'Select'}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="text-gray-500 font-bold text-sm mb-1">
                    No {matchFilter === 'all' ? '' : matchFilter} matches found
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    There are currently no {matchFilter} fixtures in the match roster.
                  </p>
                  {matchFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setMatchFilter('all')}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Show All Matches
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSwitchModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: QUICK INCIDENT LOGGER MODAL --- */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingIncidentId
                    ? 'Edit Match Incident'
                    : incidentType === 'goal'
                    ? 'Record Goal & Update Timeline'
                    : incidentType === 'shot'
                    ? 'Record Shot on Goal'
                    : 'Log Match Incident'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingIncidentId ? 'Modifying recorded incident on live timeline for ' : 'Recording to live timeline for '}
                  <strong className="text-gray-900">{homeName} vs {awayName}</strong> ({matchState?.venue || 'Arena'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsIncidentModalOpen(false);
                  setEditingIncidentId(null);
                }}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-3.5">
              {/* Event Type & Team Tabs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Team
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIncidentTeam('home');
                        if (!editingIncidentId) {
                          setIncidentPlayer(homeLineup[1]?.name || homeLineup[0]?.name || '');
                          setIncidentAssist(homeLineup[2]?.name || '');
                        }
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        incidentTeam === 'home' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIncidentTeam('away');
                        if (!editingIncidentId) {
                          setIncidentPlayer(awayLineup[1]?.name || awayLineup[0]?.name || '');
                          setIncidentAssist(awayLineup[2]?.name || '');
                        }
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        incidentTeam === 'away' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Away
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Event Type
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="goal">Goal {editingIncidentId ? '' : '(+1 Score)'}</option>
                    <option value="shot">Shot on Goal {editingIncidentId ? '' : '(+1 SOG)'}</option>
                    <option value="penalty">Penalty (PIM)</option>
                    <option value="timeout">30s Official Timeout</option>
                  </select>
                </div>
              </div>

              {/* Period & Game Clock Stamp */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Game Period
                  </label>
                  <select
                    value={incidentPeriod}
                    onChange={(e) => setIncidentPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="1">1st Period (P1)</option>
                    <option value="2">2nd Period (P2)</option>
                    <option value="3">3rd Period (P3)</option>
                    <option value="OT">Overtime (OT)</option>
                    <option value="SO">Shootout (SO)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Exact Clock Time
                    </label>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => setIncidentMinute(formattedTime)}
                        className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                        title="Reset to current countdown clock time"
                      >
                        Reset to Now ({formattedTime})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={incidentMinute}
                    onChange={(e) => setIncidentMinute(e.target.value)}
                    placeholder="e.g. 14:22"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Preset to clock time when clicked • Editable
                  </span>
                </div>
              </div>

              {/* Player Scorer / Offender */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  {incidentType === 'goal'
                    ? 'Goal Scorer'
                    : incidentType === 'shot'
                    ? 'Shot Maker (Player taking shot)'
                    : incidentType === 'penalty'
                    ? 'Penalized Player'
                    : 'Team / Coach'}
                </label>
                <select
                  value={incidentPlayer}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setIncidentPlayer(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer mb-1.5"
                >
                  <option value="">-- Select from Active Roster --</option>
                  {(incidentTeam === 'home' ? homeLineup : awayLineup).map(p => (
                    <option key={p.number} value={p.name}>
                      #{p.number} {p.name} ({p.pos})
                    </option>
                  ))}
                  <option value="custom">-- Custom Name (Type Below) --</option>
                </select>

                <input
                  type="text"
                  value={incidentPlayer}
                  onChange={(e) => setIncidentPlayer(e.target.value)}
                  placeholder={
                    incidentType === 'goal'
                      ? 'Goal Scorer Name (e.g. Connor Bedard)'
                      : incidentType === 'shot'
                      ? 'Shot Maker Name (e.g. Connor Bedard)'
                      : 'Player Name'
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              {/* Assist & Goal Type if Goal */}
              {incidentType === 'goal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Primary Assist (Optional)
                    </label>
                    <input
                      type="text"
                      value={incidentAssist}
                      onChange={(e) => setIncidentAssist(e.target.value)}
                      placeholder="e.g. Bedard C. or Kane P."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Goal Strength
                    </label>
                    <select
                      value={incidentGoalType}
                      onChange={(e) => setIncidentGoalType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value="EV">Even Strength (EV)</option>
                      <option value="PPG">Power Play Goal (PPG)</option>
                      <option value="SHG">Short Handed Goal (SHG)</option>
                      <option value="ENG">Empty Net Goal (ENG)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Penalty Reason if Penalty */}
              {incidentType === 'penalty' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Infraction
                    </label>
                    <select
                      value={incidentPenaltyReason}
                      onChange={(e) => setIncidentPenaltyReason(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value="Tripping">Tripping</option>
                      <option value="Slashing">Slashing</option>
                      <option value="Roughing">Roughing</option>
                      <option value="Hooking">Hooking</option>
                      <option value="High-Sticking">High-Sticking</option>
                      <option value="Interference">Interference</option>
                      <option value="Cross-Checking">Cross-Checking</option>
                      <option value="Boarding">Boarding</option>
                      <option value="Holding">Holding</option>
                      <option value="Misconduct">Misconduct</option>
                      <option value="Delay of Game">Delay of Game</option>
                      <option value="Spearing">Spearing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Minutes (PIM)
                    </label>
                    <select
                      value={incidentPenaltyMins}
                      onChange={(e) => setIncidentPenaltyMins(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value={2}>2 Min Minor</option>
                      <option value={4}>4 Min Double Minor</option>
                      <option value={5}>5 Min Major</option>
                      <option value={10}>10 Min Misconduct</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsIncidentModalOpen(false);
                    setEditingIncidentId(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>{editingIncidentId ? 'Save Changes' : 'Record & Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4B: SHOT MAKER MODAL --- */}
      {isShotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Record Shot on Goal
                </h3>
                <p className="text-xs text-gray-500">
                  Select shot maker to update Shots on Goal for{' '}
                  <strong className="text-gray-900">{shotTeam === 'home' ? homeName : awayName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShotModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitShot} className="space-y-3.5">
              {/* Team Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Team Taking Shot
                </label>
                <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShotTeam('home');
                      setShotPlayer(homeLineup[0]?.name || homeLineup[1]?.name || '');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      shotTeam === 'home' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Home ({homeName})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShotTeam('away');
                      setShotPlayer(awayLineup[0]?.name || awayLineup[1]?.name || '');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      shotTeam === 'away' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Away ({awayName})
                  </button>
                </div>
              </div>

              {/* Game Period & Clock Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Game Period
                  </label>
                  <select
                    value={shotPeriod}
                    onChange={(e) => setShotPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="1">1st Period (P1)</option>
                    <option value="2">2nd Period (P2)</option>
                    <option value="3">3rd Period (P3)</option>
                    <option value="OT">Overtime (OT)</option>
                    <option value="SO">Shootout (SO)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Clock Time
                    </label>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => setShotMinute(formattedTime)}
                        className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                        title="Reset to current clock time"
                      >
                        Reset to Now ({formattedTime})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={shotMinute}
                    onChange={(e) => setShotMinute(e.target.value)}
                    placeholder="e.g. 14:22"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Preset to clock time when clicked • Editable
                  </span>
                </div>
              </div>

              {/* Shot Maker Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Shot Maker (Player taking shot)
                </label>
                <select
                  value={shotPlayer}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setShotPlayer(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer mb-1.5"
                >
                  <option value="">-- Select from Active Roster --</option>
                  {(shotTeam === 'home' ? homeLineup : awayLineup).map((p) => (
                    <option key={p.number} value={p.name}>
                      #{p.number} {p.name} ({p.pos})
                    </option>
                  ))}
                  <option value="custom">-- Custom Player (Type Below) --</option>
                </select>

                <input
                  type="text"
                  value={shotPlayer}
                  onChange={(e) => setShotPlayer(e.target.value)}
                  placeholder="Player Name (e.g. Connor Bedard)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              {/* Current SOG Preview */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Team SOG after recording:</span>
                <span className="font-mono font-bold text-gray-900">
                  {(shotTeam === 'home' ? homeShots : awayShots)} ➔ {(shotTeam === 'home' ? homeShots : awayShots) + 1}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShotModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>Record Shot (+1 SOG)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
