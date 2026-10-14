import React, { useState } from 'react';
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
import { NHL_TEAMS } from '../constants/hockeyData';
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

  // Add Match Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Delete Match Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // When Home Team dropdown changes in Add Modal
  const handleHomeTeamChange = (key) => {
    setAddHomeKey(key);
    if (key !== 'custom' && NHL_TEAMS[key]) {
      setAddHomeName(NHL_TEAMS[key].name);
      setAddVenue(NHL_TEAMS[key].stadium);
    }
  };

  // When Away Team dropdown changes in Add Modal
  const handleAwayTeamChange = (key) => {
    setAddAwayKey(key);
    if (key !== 'custom' && NHL_TEAMS[key]) {
      setAddAwayName(NHL_TEAMS[key].name);
    }
  };

  // Submit Add Match
  const handleCreateMatchSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingAdd(true);

    try {
      const payload = {
        home: {
          id: addHomeKey,
          name: addHomeName || 'Home Team',
          score: parseInt(addHomeScore, 10) || 0,
          shots: 0,
          crestSvg: NHL_TEAMS[addHomeKey]?.crestSvg || null
        },
        away: {
          id: addAwayKey,
          name: addAwayName || 'Away Team',
          score: parseInt(addAwayScore, 10) || 0,
          shots: 0,
          crestSvg: NHL_TEAMS[addAwayKey]?.crestSvg || null
        },
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
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create match:', err);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Delete Match
  const handleConfirmDelete = async () => {
    if (!matchState?.id) return;
    setIsSubmittingDelete(true);

    try {
      if (onDeleteMatch) {
        await onDeleteMatch(matchState.id);
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete match:', err);
    } finally {
      setIsSubmittingDelete(false);
    }
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
      {/* Top Remote Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToScoreboard}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs transition-colors"
        >
          <span>Back to Scoreboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
            <span className="w-2 h-2 rounded-xs bg-blue-600"></span>
            <span>LIVE OPERATOR CONSOLE</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 hover:border-red-200"
            >
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Match Management & Switcher Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left: Active Match selector */}
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Current Match Under Remote Control
          </label>
          <div className="relative">
            <select
              value={matchState?.id || ''}
              onChange={(e) => onSelectMatch && onSelectMatch(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100/70 border border-gray-200 text-gray-900 font-bold text-sm sm:text-base rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-500 outline-none transition-colors cursor-pointer"
            >
              {matches && matches.length > 0 ? (
                matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.home?.name || 'Home'} ({m.home?.score ?? 0}) vs {m.away?.name || 'Away'} ({m.away?.score ?? 0}) — {m.venue || 'Arena'} [{m.period || 'P1'}]
                  </option>
                ))
              ) : (
                <option value={matchState?.id}>
                  {matchState?.home?.name} vs {matchState?.away?.name}
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Right: Add Match and Delete Match Buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
            title="Create and add a new match to the scoreboard"
          >
            <span>Add Match</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={!matchState || matches.length <= 1}
            title={matches.length <= 1 ? "Cannot delete the last remaining match" : "Delete the current match from the scoreboard"}
            className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold border border-gray-200 hover:border-red-200 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <span>Delete Match</span>
          </button>
        </div>
      </div>

      {/* Console Mode Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6 border border-gray-200">
        <button
          onClick={() => setConsoleTab('operator')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center ${
            consoleTab === 'operator'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>Live Operator Console</span>
        </button>

        <button
          onClick={() => setConsoleTab('admin')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
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
          {/* 1. Game Clock Controls Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-base">Game Clock Control</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConsoleTab('admin')}
                  className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  <span>Correct Time</span>
                </button>
                <span className={`text-xs font-bold tracking-wide ${
                  isRunning ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {isRunning ? 'CLOCK RUNNING' : 'CLOCK PAUSED'}
                </span>
              </div>
            </div>

            {/* Big Clock Display */}
            <div className="text-center py-4 bg-gray-50 rounded-2xl border border-gray-200/60 mb-6">
              <div className="text-5xl sm:text-7xl font-mono font-black tracking-tight text-gray-900">
                {formattedTime}
              </div>
              <div className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                Period {matchState?.period} • {isRunning ? 'Counting Down' : 'Ready'}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {isRunning ? (
                <button
                  onClick={() => scoreboard.pauseClock(remainingSeconds)}
                  className="col-span-2 sm:col-span-2 flex items-center justify-center gap-2 py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-base shadow-xs transition-all active:scale-98"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Clock</span>
                </button>
              ) : (
                <button
                  onClick={scoreboard.startClock}
                  className="col-span-2 sm:col-span-2 flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base shadow-xs transition-all active:scale-98"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Clock</span>
                </button>
              )}

              <button
                onClick={() => scoreboard.resetClock(1200)}
                className="flex items-center justify-center gap-1.5 py-4 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-semibold text-sm transition-all active:scale-98"
                title="Reset to 20:00"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset 20:00</span>
              </button>

              <button
                onClick={() => scoreboard.resetClock(300)}
                className="flex items-center justify-center gap-1.5 py-4 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-semibold text-sm transition-all active:scale-98"
                title="Reset to 5:00 (Overtime)"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset 5:00 (OT)</span>
              </button>
            </div>

            {/* Fine Tuning Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs font-semibold text-gray-600">
              <span className="text-gray-400">Quick Adjust:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, 60)}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  +1 min
                </button>
                <button
                  onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, -60)}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  -1 min
                </button>
                <button
                  onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, 10)}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  +10 sec
                </button>
                <button
                  onClick={() => scoreboard.adjustClockSeconds(remainingSeconds, -10)}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  -10 sec
                </button>
              </div>
            </div>
          </div>

          {/* 2. Team Scores Control Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-base">Match Score Control</h3>
              <button
                onClick={() => setConsoleTab('admin')}
                className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <span>Override Score (Admin)</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Home Score Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                      HOME TEAM
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{matchState?.venue || 'United Center'}</span>
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-6 truncate">
                    {matchState?.home?.name || 'Home Team'}
                  </h4>

                  <div className="text-center my-6">
                    <span className="text-7xl font-black text-gray-900 font-mono tracking-tight">
                      {matchState?.home?.score ?? 0}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={scoreboard.decrementHomeScore}
                    className="flex items-center justify-center gap-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
                    title="Subtract 1 goal"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <button
                    onClick={scoreboard.incrementHomeScore}
                    className="flex items-center justify-center gap-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95"
                    title="Add 1 goal"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Away Score Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">
                      AWAY TEAM
                    </span>
                    <span className="text-xs text-gray-400 font-medium">VISITOR</span>
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-6 truncate">
                    {matchState?.away?.name || 'Away Team'}
                  </h4>

                  <div className="text-center my-6">
                    <span className="text-7xl font-black text-gray-900 font-mono tracking-tight">
                      {matchState?.away?.score ?? 0}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={scoreboard.decrementAwayScore}
                    className="flex items-center justify-center gap-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
                    title="Subtract 1 goal"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <button
                    onClick={scoreboard.incrementAwayScore}
                    className="flex items-center justify-center gap-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95"
                    title="Add 1 goal"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Period Selection Switcher */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <h3 className="font-bold text-gray-900 text-base mb-3">
              Period / Match State
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['1', '2', '3', 'OT', 'SO', 'FT'].map((periodKey) => {
                const isSelected = String(matchState?.period) === periodKey;
                const label = periodKey === 'FT' ? 'Full Time' : periodKey === 'OT' ? 'Overtime' : periodKey === 'SO' ? 'Shootout' : `Period ${periodKey}`;
                return (
                  <button
                    key={periodKey}
                    onClick={() => scoreboard.setPeriod(periodKey)}
                    className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Match Switcher Presets */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Quick Match Presets</h3>
                <p className="text-xs text-gray-400">Instantly switch team names and home arenas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => applyPresetMatchup('blackhawks', 'penguins')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all"
              >
                <div className="text-xs font-bold text-gray-900">Blackhawks vs Penguins</div>
                <div className="text-[11px] text-gray-500">United Center</div>
              </button>

              <button
                onClick={() => applyPresetMatchup('jets', 'wild')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all"
              >
                <div className="text-xs font-bold text-gray-900">Jets vs Wild</div>
                <div className="text-[11px] text-gray-500">Canada Life Centre</div>
              </button>

              <button
                onClick={() => applyPresetMatchup('stars', 'avalanche')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all"
              >
                <div className="text-xs font-bold text-gray-900">Stars vs Avalanche</div>
                <div className="text-[11px] text-gray-500">American Airlines Center</div>
              </button>

              <button
                onClick={() => applyPresetMatchup('predators', 'knights')}
                className="p-3 rounded-2xl border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50/30 text-left transition-all"
              >
                <div className="text-xs font-bold text-gray-900">Predators vs Golden Knights</div>
                <div className="text-[11px] text-gray-500">Bridgestone Arena</div>
              </button>
            </div>
          </div>

          {/* 5. Game Actions: New Game */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div>
              <h4 className="font-bold text-base text-gray-900">
                Reset Current Game
              </h4>
              <p className="text-xs text-gray-400">
                Clear scores back to 0 - 0 and reset period to 1
              </p>
            </div>

            <div>
              <button
                onClick={() => setResetConfirmOpen(true)}
                className="px-5 py-3 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 font-bold text-sm rounded-2xl transition-all border border-gray-200 hover:border-red-200"
                title="Reset scores and start a fresh game"
              >
                <span>New Game</span>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Home Team
                </label>
                <select
                  value={addHomeKey}
                  onChange={(e) => handleHomeTeamChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none mb-2"
                >
                  {Object.entries(NHL_TEAMS).map(([key, team]) => (
                    <option key={key} value={key}>
                      {team.name} ({team.stadium})
                    </option>
                  ))}
                  <option value="custom">-- Custom Team --</option>
                </select>

                <input
                  type="text"
                  value={addHomeName}
                  onChange={(e) => setAddHomeName(e.target.value)}
                  placeholder="Home Team Name"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                  required
                />
              </div>

              {/* Away Team Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Away Team
                </label>
                <select
                  value={addAwayKey}
                  onChange={(e) => handleAwayTeamChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none mb-2"
                >
                  {Object.entries(NHL_TEAMS).map(([key, team]) => (
                    <option key={key} value={key}>
                      {team.name}
                    </option>
                  ))}
                  <option value="custom">-- Custom Team --</option>
                </select>

                <input
                  type="text"
                  value={addAwayName}
                  onChange={(e) => setAddAwayName(e.target.value)}
                  placeholder="Away Team Name"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                  required
                />
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors"
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

      {/* --- MODAL 2: DELETE MATCH CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Delete This Match?
            </h3>

            <p className="text-xs text-gray-600 text-center mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">{matchState?.home?.name} vs {matchState?.away?.name}</strong>? This fixture will be permanently removed from all scoreboards and user views.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <span>{isSubmittingDelete ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
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
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
              >
                <span>Cancel</span>
              </button>
              <button
                onClick={() => {
                  scoreboard.resetMatch();
                  setResetConfirmOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-md shadow-red-600/20"
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
