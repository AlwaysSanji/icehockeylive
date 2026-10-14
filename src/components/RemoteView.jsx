import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Clock, 
  AlertCircle 
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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
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

  // Switch Match Modal State
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  // Quick Incident Logger Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentTeam, setIncidentTeam] = useState('home');
  const [incidentType, setIncidentType] = useState('goal'); // 'goal', 'penalty', 'timeout'
  const [incidentPlayer, setIncidentPlayer] = useState('');
  const [incidentAssist, setIncidentAssist] = useState('');
  const [incidentPenaltyReason, setIncidentPenaltyReason] = useState('Tripping');
  const [incidentPenaltyMins, setIncidentPenaltyMins] = useState(2);
  const [incidentMinute, setIncidentMinute] = useState('');

  // Spacebar keyboard shortcut for clock start/stop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
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
  }, [isRunning, remainingSeconds, scoreboard]);

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

  // Open Quick Incident Logger
  const openIncidentLogger = (team, type = 'goal') => {
    setIncidentTeam(team);
    setIncidentType(type);
    setIncidentMinute(formattedTime);
    const activeLineup = team === 'home' ? homeLineup : awayLineup;
    setIncidentPlayer(activeLineup[1]?.name || '');
    setIncidentAssist(activeLineup[2]?.name || '');
    setIsIncidentModalOpen(true);
  };

  // Submit Incident Logger
  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    const periodLabel = `P${matchState?.period || '1'}`;
    const timeLabel = incidentMinute || formattedTime;
    const teamName = incidentTeam === 'home' ? homeName : awayName;

    if (incidentType === 'goal') {
      if (incidentTeam === 'home') {
        scoreboard.incrementHomeScore();
      } else {
        scoreboard.incrementAwayScore();
      }
      scoreboard.blastHorn();

      const newHomeScore = homeScore + (incidentTeam === 'home' ? 1 : 0);
      const newAwayScore = awayScore + (incidentTeam === 'away' ? 1 : 0);

      if (scoreboard.addIncident) {
        scoreboard.addIncident({
          time: timeLabel,
          period: periodLabel,
          team: incidentTeam,
          type: 'goal',
          scorer: incidentPlayer || `${teamName} Forward`,
          assist: incidentAssist || '',
          score: `${newHomeScore} - ${newAwayScore}`,
          text: `Goal! ${teamName} (${newHomeScore} - ${newAwayScore})`
        });
      }
    } else if (incidentType === 'penalty') {
      if (scoreboard.addIncident) {
        scoreboard.addIncident({
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
        scoreboard.addIncident({
          time: timeLabel,
          period: periodLabel,
          team: incidentTeam,
          type: 'timeout',
          text: `30-Second Timeout Called by ${teamName}`
        });
      }
    }

    setIsIncidentModalOpen(false);
  };

  // Quick Preset matchups
  const applyPresetMatchup = (homeKey, awayKey) => {
    const homeTeam = NHL_TEAMS[homeKey];
    const awayTeam = NHL_TEAMS[awayKey];
    if (homeTeam && awayTeam) {
      scoreboard.updateTeamDetails({
        home: {
          id: homeKey,
          name: homeTeam.name,
          score: 0,
          shots: 0
        },
        away: {
          id: awayKey,
          name: awayTeam.name,
          score: 0,
          shots: 0
        },
        venue: homeTeam.stadium
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToScoreboard}
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <span>Back to Scoreboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
            <span>LIVE OPERATOR CONSOLE</span>
          </div>

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

        {/* Top Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-wider uppercase text-gray-300">
              {isRunning ? 'BROADCAST CLOCK RUNNING' : 'ARENA CLOCK PAUSED'}
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

        {/* Jumbotron Matchup Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
          {/* Home Team */}
          <div className="flex items-center justify-start md:justify-end gap-4 text-left md:text-right min-w-0">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">
                HOME TEAM {matchState?.powerPlay === 'home' && <span className="ml-1 text-amber-300 font-extrabold">• POWER PLAY</span>}
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
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Period {matchState?.period || '1'}
              </span>
              <span className="text-gray-600">•</span>
              <span className="font-mono text-xs font-bold text-gray-300 tracking-wider">
                {formattedTime}
              </span>
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
                AWAY TEAM {matchState?.powerPlay === 'away' && <span className="ml-1 text-amber-300 font-extrabold">• POWER PLAY</span>}
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

      {/* 2. ARENA AUDIO & ATMOSPHERE BAR */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Arena Atmosphere & Live Sounds</h3>
          <p className="text-xs text-gray-400 mt-0.5">Blast real synthesized arena horns and end-of-period buzzers</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={scoreboard.blastHorn}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
            title="Blast Goal Horn across all connected spectators"
          >
            <span>Blast Goal Horn</span>
          </button>

          <button
            type="button"
            onClick={scoreboard.playPeriodBuzzer}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-200 active:scale-95 transition-all cursor-pointer"
            title="Sound End of Period Buzzer"
          >
            <span>Sound Period Buzzer</span>
          </button>
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
          {/* 3. PRECISION GAME CLOCK CONTROLS */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-base">Game Clock Control</h3>
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
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                >
                  +1s
                </button>
                <button
                  type="button"
                  onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, -1)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-bold cursor-pointer"
                >
                  -1s
                </button>
              </div>
            </div>
          </div>

          {/* 4. DUAL TEAM STATIONS: GOALS, SOG & POWER PLAY */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-base">Team Scoring & Shot Control</h3>
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
                      HOME TEAM
                    </span>
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
                      Goals
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
                      onClick={() => {
                        scoreboard.incrementHomeScore();
                        scoreboard.blastHorn();
                      }}
                      className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      title="Add 1 goal and sound horn"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs">+1 Goal</span>
                    </button>
                  </div>

                  {/* Shots on Goal Control */}
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-600">
                      Shots on Goal: <strong className="text-gray-900">{homeShots}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={scoreboard.decrementHomeShots}
                        className="w-7 h-7 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700 cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={scoreboard.incrementHomeShots}
                        className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

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
                      AWAY TEAM
                    </span>
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
                      Goals
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
                      onClick={() => {
                        scoreboard.incrementAwayScore();
                        scoreboard.blastHorn();
                      }}
                      className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      title="Add 1 goal and sound horn"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs">+1 Goal</span>
                    </button>
                  </div>

                  {/* Shots on Goal Control */}
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-600">
                      Shots on Goal: <strong className="text-gray-900">{awayShots}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={scoreboard.decrementAwayShots}
                        className="w-7 h-7 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700 cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={scoreboard.incrementAwayShots}
                        className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

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

          {/* 5. PERIOD & GAME STATE SWITCHER */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <h3 className="font-bold text-gray-900 text-base mb-3">
              Period & Game State Selection
            </h3>
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

          {/* 6. QUICK MATCH PRESETS */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Quick Arena Presets</h3>
                <p className="text-xs text-gray-400">Instantly switch team matchups and home venues</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => applyPresetMatchup('blackhawks', 'penguins')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-gray-900">Blackhawks vs Penguins</div>
                <div className="text-[11px] text-gray-500">United Center</div>
              </button>

              <button
                type="button"
                onClick={() => applyPresetMatchup('jets', 'wild')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-gray-900">Jets vs Wild</div>
                <div className="text-[11px] text-gray-500">Canada Life Centre</div>
              </button>

              <button
                type="button"
                onClick={() => applyPresetMatchup('stars', 'avalanche')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-gray-900">Stars vs Avalanche</div>
                <div className="text-[11px] text-gray-500">American Airlines Center</div>
              </button>

              <button
                type="button"
                onClick={() => applyPresetMatchup('predators', 'knights')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50/30 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-gray-900">Predators vs Golden Knights</div>
                <div className="text-[11px] text-gray-500">Bridgestone Arena</div>
              </button>
            </div>
          </div>

          {/* 7. RESET CURRENT MATCH */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div>
              <h4 className="font-bold text-base text-gray-900">
                Reset Current Game Scores & Clock
              </h4>
              <p className="text-xs text-gray-400">
                Reset scores to 0 - 0, period to 1, and clock back to 20:00 across all displays
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="px-5 py-3 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 font-bold text-sm rounded-2xl transition-all border border-gray-200 hover:border-red-200 cursor-pointer"
                title="Reset scores and start a fresh game"
              >
                <span>Reset Game</span>
              </button>
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
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded shrink-0">
                                Active In Remote
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

      {/* --- MODAL 3: SWITCH ACTIVE MATCH MODAL --- */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Select Match to Control
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose which fixture you want to manage in the Remote Control console
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

            <div className="py-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
              {matches && matches.length > 0 ? (
                matches.map((m) => {
                  const isCurrentActive = m.id === matchState?.id;

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
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm truncate">
                            {m.home?.name || 'Home'} <span className="font-black text-gray-800">({m.home?.score ?? 0} - {m.away?.score ?? 0})</span> {m.away?.name || 'Away'}
                          </span>
                          {isCurrentActive && (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded shrink-0">
                              Now Controlling
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>{m.venue || 'Arena'}</span>
                          <span>•</span>
                          <span>{m.period === 'FT' ? 'Finished' : (m.period === 'UPCOMING' ? 'Upcoming' : `Period ${m.period}`)}</span>
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
                <div className="text-center py-6 text-gray-400 text-xs">
                  No matches available.
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
                  Log Match Incident
                </h3>
                <p className="text-xs text-gray-500">
                  Record an event directly into the live match incident timeline
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(false)}
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
                      onClick={() => setIncidentTeam('home')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        incidentTeam === 'home' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncidentTeam('away')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
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
                    <option value="goal">Goal (+1 Score)</option>
                    <option value="penalty">2 Min Minor Penalty</option>
                    <option value="timeout">30s Timeout</option>
                  </select>
                </div>
              </div>

              {/* Player Scorer / Offender */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  {incidentType === 'goal' ? 'Goal Scorer' : incidentType === 'penalty' ? 'Penalized Player' : 'Team / Coach'}
                </label>
                <select
                  value={incidentPlayer}
                  onChange={(e) => setIncidentPlayer(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer mb-1.5"
                >
                  {(incidentTeam === 'home' ? homeLineup : awayLineup).map(p => (
                    <option key={p.number} value={p.name}>
                      #{p.number} {p.name} ({p.pos})
                    </option>
                  ))}
                  <option value="custom">-- Custom Name --</option>
                </select>

                <input
                  type="text"
                  value={incidentPlayer}
                  onChange={(e) => setIncidentPlayer(e.target.value)}
                  placeholder="Player Name"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              {/* Assist if Goal */}
              {incidentType === 'goal' && (
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
                    </select>
                  </div>
                </div>
              )}

              {/* Game Clock Stamp */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Incident Time (Clock)
                </label>
                <input
                  type="text"
                  value={incidentMinute}
                  onChange={(e) => setIncidentMinute(e.target.value)}
                  placeholder="e.g. 14:22"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>Record & Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: RESET GAME CONFIRMATION MODAL --- */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Start a New Game?
            </h3>
            <p className="text-xs text-gray-500 text-center mb-6">
              This will reset the score to 0 - 0, set the period back to 1, and reset the clock to 20:00 across all displays.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 cursor-pointer"
              >
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  scoreboard.resetMatch();
                  setResetConfirmOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-md shadow-red-600/20 cursor-pointer"
              >
                <span>Reset Match</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
