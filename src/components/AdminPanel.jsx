import React, { useState, useEffect, useMemo } from 'react';
import { Check, Shield, Users, UserCheck, UserX } from 'lucide-react';
import { getTeamLineup } from '../constants/hockeyData';
import { getAllRegisteredUsers, toggleUserRemoteAccess } from '../services/authService';

export function AdminPanel({ matchState, scoreboard, remainingSeconds, isRunning, currentUser }) {
  const isCompleted = matchState?.period === 'FT' || matchState?.status === 'Finished' || matchState?.status === 'FT';
  const [activeTab, setActiveTab] = useState(() => isCompleted ? 'score' : 'time'); // 'time', 'score', 'schedule', 'timeline', 'users'
  const [notification, setNotification] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState(() => getAllRegisteredUsers());

  // Switch to score tab if match becomes completed
  useEffect(() => {
    if (isCompleted && (activeTab === 'time' || activeTab === 'schedule')) {
      setActiveTab('score');
    }
  }, [isCompleted, activeTab]);

  // 1. Time Correction State
  const [inputMinutes, setInputMinutes] = useState(() => Math.floor(remainingSeconds / 60));
  const [inputSeconds, setInputSeconds] = useState(() => remainingSeconds % 60);

  // Sync inputs with remaining seconds when paused or changed externally
  useEffect(() => {
    if (!isRunning) {
      setInputMinutes(Math.floor(remainingSeconds / 60));
      setInputSeconds(remainingSeconds % 60);
    }
  }, [remainingSeconds, isRunning]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleToggleUserAccess = (userId, userName) => {
    const updated = toggleUserRemoteAccess(userId);
    setRegisteredUsers(updated);
    const target = updated.find(u => u.id === userId || u.username === userId);
    showNotification(
      target?.canControlRemote
        ? `Granted remote control access to ${userName} (Role: Operator)`
        : `Revoked remote control access for ${userName} (Role: Spectator)`
    );
  };

  const handleApplyTime = (e) => {
    e?.preventDefault();
    const mins = Math.max(0, parseInt(inputMinutes, 10) || 0);
    const secs = Math.max(0, Math.min(59, parseInt(inputSeconds, 10) || 0));
    const totalSecs = mins * 60 + secs;
    scoreboard.setExactClockTime(totalSecs);
    showNotification(`Clock corrected to ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
  };

  const handlePresetTime = (mins, secs = 0) => {
    setInputMinutes(mins);
    setInputSeconds(secs);
    const totalSecs = mins * 60 + secs;
    scoreboard.setExactClockTime(totalSecs);
    showNotification(`Clock preset applied: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
  };

  const handleFineAdjustSeconds = (delta) => {
    const newRemaining = Math.max(0, remainingSeconds + delta);
    scoreboard.setExactClockTime(newRemaining);
    setInputMinutes(Math.floor(newRemaining / 60));
    setInputSeconds(newRemaining % 60);
    showNotification(`Adjusted ${delta > 0 ? `+${delta}` : delta}s`);
  };

  // 2. Score Override State
  const [homeScore, setHomeScore] = useState(matchState.home?.score || 0);
  const [awayScore, setAwayScore] = useState(matchState.away?.score || 0);
  const [homeShots, setHomeShots] = useState(matchState.home?.shots || 0);
  const [awayShots, setAwayShots] = useState(matchState.away?.shots || 0);

  const [periodScores, setPeriodScores] = useState({
    p1: { home: matchState.periodScores?.p1?.home || 0, away: matchState.periodScores?.p1?.away || 0 },
    p2: { home: matchState.periodScores?.p2?.home || 0, away: matchState.periodScores?.p2?.away || 0 },
    p3: { home: matchState.periodScores?.p3?.home || 0, away: matchState.periodScores?.p3?.away || 0 },
    ot: { home: matchState.periodScores?.ot?.home || 0, away: matchState.periodScores?.ot?.away || 0 }
  });

  // Keep state updated when matchState changes externally
  useEffect(() => {
    setHomeScore(matchState.home?.score || 0);
    setAwayScore(matchState.away?.score || 0);
    setHomeShots(matchState.home?.shots || 0);
    setAwayShots(matchState.away?.shots || 0);
    if (matchState.periodScores) {
      setPeriodScores({
        p1: { home: matchState.periodScores.p1?.home || 0, away: matchState.periodScores.p1?.away || 0 },
        p2: { home: matchState.periodScores.p2?.home || 0, away: matchState.periodScores.p2?.away || 0 },
        p3: { home: matchState.periodScores.p3?.home || 0, away: matchState.periodScores.p3?.away || 0 },
        ot: { home: matchState.periodScores.ot?.home || 0, away: matchState.periodScores.ot?.away || 0 }
      });
    }
  }, [matchState]);

  const handlePeriodScoreChange = (periodKey, team, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setPeriodScores(prev => ({
      ...prev,
      [periodKey]: {
        ...prev[periodKey],
        [team]: num
      }
    }));
  };

  const handleAutoSumFromPeriods = () => {
    const calcHome = (periodScores.p1.home || 0) + (periodScores.p2.home || 0) + (periodScores.p3.home || 0) + (periodScores.ot.home || 0);
    const calcAway = (periodScores.p1.away || 0) + (periodScores.p2.away || 0) + (periodScores.p3.away || 0) + (periodScores.ot.away || 0);
    setHomeScore(calcHome);
    setAwayScore(calcAway);
    showNotification(`Scores summed: Home ${calcHome} - Away ${calcAway}`);
  };

  const handleApplyScores = (e) => {
    e?.preventDefault();
    scoreboard.setExactScores({
      homeScore,
      awayScore,
      homeShots,
      awayShots,
      periodScores
    });
    showNotification(`Scores updated: ${matchState.home?.name || 'Home'} ${homeScore} - ${awayScore} ${matchState.away?.name || 'Away'}`);
  };

  // 3. Schedule & Match Details State
  const [scheduleDate, setScheduleDate] = useState(matchState.date || 'Wed, Oct 14, 2026');
  const [scheduleTime, setScheduleTime] = useState(matchState.dateTime || 'Wed, Oct 14, 2026 05:30');
  const [venue, setVenue] = useState(matchState.venue || 'United Center');
  const [referee, setReferee] = useState(matchState.referee || 'Furlatt E.');
  const [matchStatus, setMatchStatus] = useState(matchState.period || 'FT');

  useEffect(() => {
    setScheduleDate(matchState.date || 'Wed, Oct 14, 2026');
    setScheduleTime(matchState.dateTime || 'Wed, Oct 14, 2026 05:30');
    setVenue(matchState.venue || 'United Center');
    setReferee(matchState.referee || 'Furlatt E.');
    setMatchStatus(matchState.period || 'FT');
  }, [matchState]);

  const handleApplySchedule = (e) => {
    e?.preventDefault();
    scoreboard.updateSchedule({
      date: scheduleDate,
      dateTime: scheduleTime,
      venue,
      referee,
      period: matchStatus
    });
    showNotification('Match schedule & status updated successfully');
  };

  // 4. Timeline Incident State
  const [timelineType, setTimelineType] = useState('goal'); // 'goal', 'penalty_shot', 'penalty', 'timeout'
  const [timelinePenaltyShotResult, setTimelinePenaltyShotResult] = useState('scored'); // 'scored', 'missed'
  const [timelineGoalie, setTimelineGoalie] = useState('');
  const [timelineMissReason, setTimelineMissReason] = useState('Saved by Goalie');
  const [timelineTeam, setTimelineTeam] = useState('home');
  const [timelinePlayer, setTimelinePlayer] = useState('');
  const [timelineAssist, setTimelineAssist] = useState('');
  const [timelineInfraction, setTimelineInfraction] = useState('Tripping');
  const [timelineMinutes, setTimelineMinutes] = useState(2);
  const [timelinePeriod, setTimelinePeriod] = useState(matchState?.period || '1');
  const [timelineClock, setTimelineClock] = useState('10:00');
  const [timelineGoalType, setTimelineGoalType] = useState('EV');
  const [timelineAutoScore, setTimelineAutoScore] = useState(true);
  const [timelineAutoPP, setTimelineAutoPP] = useState(true);

  const homeLineup = useMemo(() => getTeamLineup(matchState.home?.id, matchState.home?.name), [matchState.home?.id, matchState.home?.name]);
  const awayLineup = useMemo(() => getTeamLineup(matchState.away?.id, matchState.away?.name), [matchState.away?.id, matchState.away?.name]);

  const handleAdminAddIncident = async (e) => {
    e?.preventDefault();
    const periodLabel = `P${timelinePeriod || matchState?.period || '1'}`;
    const teamName = timelineTeam === 'home' ? (matchState.home?.name || 'Home') : (matchState.away?.name || 'Away');

    if (timelineType === 'goal') {
      if (timelineAutoScore) {
        if (timelineTeam === 'home') scoreboard.incrementHomeScore();
        else scoreboard.incrementAwayScore();
      }
      const newH = (matchState.home?.score || 0) + (timelineAutoScore && timelineTeam === 'home' ? 1 : 0);
      const newA = (matchState.away?.score || 0) + (timelineAutoScore && timelineTeam === 'away' ? 1 : 0);

      await scoreboard.addIncident({
        time: timelineClock || '10:00',
        period: periodLabel,
        team: timelineTeam,
        type: 'goal',
        scorer: timelinePlayer || `${teamName} Scorer`,
        assist: timelineAssist || '',
        goalType: timelineGoalType,
        score: `${newH} - ${newA}`,
        text: `Goal! ${teamName} (${newH} - ${newA})`
      });
      showNotification(`Goal recorded on live timeline for ${teamName}`);
    } else if (timelineType === 'penalty_shot') {
      const isScored = timelinePenaltyShotResult === 'scored';
      await scoreboard.addIncident({
        time: timelineClock || '10:00',
        period: periodLabel,
        team: timelineTeam,
        type: 'penalty_shot',
        penaltyShotResult: timelinePenaltyShotResult,
        player: timelinePlayer || `${teamName} Shooter`,
        scorer: isScored ? (timelinePlayer || `${teamName} Shooter`) : null,
        shotPlayer: timelinePlayer || `${teamName} Shooter`,
        goalie: timelineGoalie || '',
        missReason: !isScored ? timelineMissReason : null,
        incrementScore: isScored,
        incrementShots: true,
        text: isScored
          ? `Penalty Shot Goal! ${timelinePlayer || `${teamName} Shooter`} (${teamName})`
          : `Penalty Shot Missed (${timelineMissReason || 'Saved'}) - ${timelinePlayer || `${teamName} Shooter`} (${teamName})`
      });
      showNotification(`Penalty shot (${isScored ? 'Scored' : 'Missed'}) recorded for ${teamName}`);
    } else if (timelineType === 'penalty') {
      await scoreboard.addIncident({
        time: timelineClock || '10:00',
        period: periodLabel,
        team: timelineTeam,
        type: 'penalty',
        penaltyPlayer: timelinePlayer || `${teamName} Player`,
        penaltyMin: timelineMinutes,
        penaltyReason: timelineInfraction,
        text: `${timelineMinutes} Min Penalty (${timelineInfraction}) - ${timelinePlayer}`
      });
      if (timelineAutoPP && scoreboard.setPowerPlay) {
        scoreboard.setPowerPlay(timelineTeam === 'home' ? 'away' : 'home');
      }
      showNotification(`Penalty recorded on live timeline for ${teamName}`);
    } else if (timelineType === 'timeout') {
      await scoreboard.addIncident({
        time: timelineClock || '10:00',
        period: periodLabel,
        team: timelineTeam,
        type: 'timeout',
        text: `30-Second Timeout Called by ${teamName}`
      });
      showNotification(`Timeout recorded on live timeline for ${teamName}`);
    }

    setTimelinePlayer('');
    setTimelineAssist('');
  };

  const handleAdminDeleteIncident = async (id) => {
    if (!window.confirm('Are you sure you want to delete this incident from the timeline?')) return;
    if (scoreboard.deleteIncident) {
      await scoreboard.deleteIncident(id, false);
      showNotification('Incident deleted from timeline');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            Administrator Master Controls
          </h3>
          <p className="text-[11px] text-gray-400">
            Direct real-time override for time correction, scores, schedule, and live timeline
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
          {!isCompleted && (
            <button
              onClick={() => setActiveTab('time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'time'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Correct Time</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('score')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'score'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{isCompleted ? 'Edit Final Score' : 'Change Score'}</span>
          </button>

          {!isCompleted && (
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Change Schedule</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Set Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Access</span>
          </button>
        </div>
      </div>

      {/* Active Match Identifier Banner */}
      <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-0.5">
            {isCompleted ? 'Editing Completed Match Fixture' : 'Currently Editing Match Fixture'}
          </div>
          <div className="text-base font-black text-white">
            {matchState.home?.name || 'Home Team'} <span className="text-blue-400 font-mono">({matchState.home?.score ?? 0})</span> vs <span className="text-amber-400 font-mono">({matchState.away?.score ?? 0})</span> {matchState.away?.name || 'Away Team'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-300 font-mono text-[11px]">
          <span>{matchState.venue || 'Arena'}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{isCompleted ? 'Finished (Full Time)' : (matchState.status || `Period ${matchState.period || '1'}`)}</span>
          <span>•</span>
          <span className="text-gray-400 font-sans">ID: {matchState.id || 'active'}</span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* --- TAB 1: CORRECT THE TIME --- */}
      {activeTab === 'time' && (
        <div className="pt-6 space-y-6">
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                Exact Clock Time Correction
              </h4>
              <p className="text-xs text-gray-500">
                Override game clock to exact minute and second for official replay corrections
              </p>
            </div>

            <form onSubmit={handleApplyTime} className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Min</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={inputMinutes}
                    onChange={(e) => setInputMinutes(e.target.value)}
                    className="w-14 text-center text-lg font-mono font-bold text-gray-900 border-none outline-none p-0"
                  />
                </div>
                <span className="text-lg font-mono font-bold text-gray-400">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Sec</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={inputSeconds}
                    onChange={(e) => setInputSeconds(e.target.value)}
                    className="w-14 text-center text-lg font-mono font-bold text-gray-900 border-none outline-none p-0"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98"
              >
                <span>Apply Time</span>
              </button>
            </form>
          </div>

          {/* Precision Adjustment: Replay Review 1-sec adjustments */}
          <div>
            <div className="text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-2">
              <span>Precision Replay Review Adjustments</span>
              <span className="text-[10px] font-normal text-gray-400">(Referees adding/deducting seconds)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(1)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                +1 sec
              </button>
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(-1)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                -1 sec
              </button>
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(5)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                +5 sec
              </button>
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(-5)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                -5 sec
              </button>
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(10)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                +10 sec
              </button>
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(-10)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                -10 sec
              </button>
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(60)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                +1 min
              </button>
              <button
                type="button"
                onClick={() => handleFineAdjustSeconds(-60)}
                className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 transition-all active:scale-95"
              >
                -1 min
              </button>
            </div>
          </div>

          {/* Quick Period Presets */}
          <div>
            <div className="text-xs font-bold text-gray-700 mb-2.5">
              Standard Period Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handlePresetTime(20, 0)}
                className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-all"
              >
                <div className="font-mono font-bold text-gray-900 text-sm">20:00</div>
                <div className="text-[11px] text-gray-500">Standard Period Start</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetTime(5, 0)}
                className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-all"
              >
                <div className="font-mono font-bold text-gray-900 text-sm">05:00</div>
                <div className="text-[11px] text-gray-500">Overtime (3-on-3)</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetTime(1, 0)}
                className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-all"
              >
                <div className="font-mono font-bold text-gray-900 text-sm">01:00</div>
                <div className="text-[11px] text-gray-500">Final Minute</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetTime(0, 0)}
                className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-all"
              >
                <div className="font-mono font-bold text-gray-900 text-sm">00:00</div>
                <div className="text-[11px] text-gray-500">Period Expired</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CHANGE SCORE --- */}
      {activeTab === 'score' && (
        <form onSubmit={handleApplyScores} className="pt-6 space-y-6">
          {/* Main Score & Shots Override */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Home Direct Score */}
            <div className="p-4 rounded-2xl bg-red-50/40 border border-red-100">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-2">
                {matchState.home?.name || 'Home Team'}
              </span>
              <div className={isCompleted ? "w-full" : "grid grid-cols-2 gap-3"}>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    {isCompleted ? 'Final Match Score' : 'Total Score'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center font-mono font-black text-2xl py-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 outline-none"
                  />
                </div>
                {!isCompleted && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Shots on Goal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={homeShots}
                      onChange={(e) => setHomeShots(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-center font-mono font-bold text-xl py-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Away Direct Score */}
            <div className="p-4 rounded-2xl bg-yellow-50/40 border border-yellow-100">
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider block mb-2">
                {matchState.away?.name || 'Away Team'}
              </span>
              <div className={isCompleted ? "w-full" : "grid grid-cols-2 gap-3"}>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    {isCompleted ? 'Final Match Score' : 'Total Score'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center font-mono font-black text-2xl py-2 bg-white border border-gray-200 rounded-xl focus:border-yellow-500 outline-none"
                  />
                </div>
                {!isCompleted && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Shots on Goal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={awayShots}
                      onChange={(e) => setAwayShots(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full text-center font-mono font-bold text-xl py-2 bg-white border border-gray-200 rounded-xl focus:border-yellow-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Period-by-Period Score Breakdown Editor */}
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-xs font-bold text-gray-900">
                  Period Breakdown (P1, P2, P3, OT)
                </h5>
                <p className="text-[11px] text-gray-400">
                  Update individual period scores displayed in the overview table
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoSumFromPeriods}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-gray-50"
              >
                Auto-Sum Total
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['p1', 'p2', 'p3', 'ot'].map((pKey) => (
                <div key={pKey} className="bg-white p-3 rounded-xl border border-gray-200/70">
                  <div className="text-[11px] font-bold uppercase text-gray-500 mb-2 text-center">
                    {pKey.toUpperCase()}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={periodScores[pKey].home}
                      onChange={(e) => handlePeriodScoreChange(pKey, 'home', e.target.value)}
                      className="w-10 text-center font-mono font-bold text-sm py-1 bg-gray-50 rounded border border-gray-200"
                      title="Home score for period"
                    />
                    <span className="text-gray-300">-</span>
                    <input
                      type="number"
                      min="0"
                      value={periodScores[pKey].away}
                      onChange={(e) => handlePeriodScoreChange(pKey, 'away', e.target.value)}
                      className="w-10 text-center font-mono font-bold text-sm py-1 bg-gray-50 rounded border border-gray-200"
                      title="Away score for period"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98"
            >
              <span>Apply Score Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 3: CHANGE SCHEDULE --- */}
      {activeTab === 'schedule' && (
        <form onSubmit={handleApplySchedule} className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Match Date
              </label>
              <input
                type="text"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                placeholder="Wed, Oct 14, 2026"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Puck Drop Date & Time
              </label>
              <input
                type="text"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                placeholder="Wed, Oct 14, 2026 05:30"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Venue / Arena
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="United Center"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Head Referee
              </label>
              <input
                type="text"
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
                placeholder="Furlatt E."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Match Status / Game Period
              </label>
              <select
                value={matchStatus}
                onChange={(e) => setMatchStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="FT">Full Time (FT / Finished)</option>
                <option value="LIVE">Live Match</option>
                <option value="1">1st Period (P1)</option>
                <option value="INT1">1st Intermission</option>
                <option value="2">2nd Period (P2)</option>
                <option value="INT2">2nd Intermission</option>
                <option value="3">3rd Period (P3)</option>
                <option value="OT">Overtime (OT)</option>
                <option value="SO">Shootout (SO)</option>
                <option value="UPCOMING">Upcoming / Scheduled</option>
                <option value="DELAYED">Delayed</option>
                <option value="POSTPONED">Postponed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98"
            >
              <span>Save Schedule & Venue</span>
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 4: SET LIVE MATCH TIMELINE (SCORERS & PENALTIES) --- */}
      {activeTab === 'timeline' && (
        <div className="pt-6 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-0.5">
              Live Match Timeline Manager (Scorers & Penalties)
            </h4>
            <p className="text-xs text-gray-500">
              Directly set goal scorers, assists, penalties, and timeouts on the live fixture timeline for {matchState.home?.name || 'Home'} vs {matchState.away?.name || 'Away'}.
            </p>
          </div>

          {/* Incident Creation Form */}
          <form onSubmit={handleAdminAddIncident} className="p-5 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-xs font-black uppercase text-gray-800 tracking-wider">
                Log New Live Incident
              </span>

              {/* Event Type selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimelineType('goal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timelineType === 'goal' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  Goal
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineType('penalty_shot')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timelineType === 'penalty_shot' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  Penalty Shot
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineType('penalty')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timelineType === 'penalty' ? 'bg-gray-900 text-white shadow-xs' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  Penalty
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineType('timeout')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timelineType === 'timeout' ? 'bg-gray-700 text-white shadow-xs' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  Timeout
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Team Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={timelineTeam}
                  onChange={(e) => setTimelineTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="home">{matchState.home?.name || 'Home Team'} (Home)</option>
                  <option value="away">{matchState.away?.name || 'Away Team'} (Away)</option>
                </select>
              </div>

              {/* Period Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Period
                </label>
                <select
                  value={timelinePeriod}
                  onChange={(e) => setTimelinePeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="1">1st Period (P1)</option>
                  <option value="2">2nd Period (P2)</option>
                  <option value="3">3rd Period (P3)</option>
                  <option value="OT">Overtime (OT)</option>
                  <option value="SO">Shootout (SO)</option>
                </select>
              </div>

              {/* Game Clock Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Game Clock (Time)
                </label>
                <input
                  type="text"
                  value={timelineClock}
                  onChange={(e) => setTimelineClock(e.target.value)}
                  placeholder="e.g. 14:22"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                  required
                />
              </div>
            </div>

            {/* Player / Infraction Row */}
            {timelineType !== 'timeout' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {timelineType === 'goal' ? 'Goal Scorer' : 'Penalized Player'}
                  </label>
                  <select
                    value={timelinePlayer}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setTimelinePlayer(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer mb-1.5"
                  >
                    <option value="">-- Select from Roster --</option>
                    {(timelineTeam === 'home' ? homeLineup : awayLineup).map(p => (
                      <option key={p.number} value={p.name}>
                        #{p.number} {p.name} ({p.pos})
                      </option>
                    ))}
                    <option value="custom">-- Custom Name (Type Below) --</option>
                  </select>
                  <input
                    type="text"
                    value={timelinePlayer}
                    onChange={(e) => setTimelinePlayer(e.target.value)}
                    placeholder="Player Name"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none"
                    required
                  />
                </div>

                {timelineType === 'goal' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Primary Assist (Optional)
                    </label>
                    <input
                      type="text"
                      value={timelineAssist}
                      onChange={(e) => setTimelineAssist(e.target.value)}
                      placeholder="e.g. Bedard C. or Kane P."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none mt-7 sm:mt-0"
                    />
                  </div>
                ) : timelineType === 'penalty_shot' ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Outcome
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTimelinePenaltyShotResult('scored')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            timelinePenaltyShotResult === 'scored'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50'
                          }`}
                        >
                          ✓ Scored (Goal)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimelinePenaltyShotResult('missed')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            timelinePenaltyShotResult === 'missed'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-rose-50'
                          }`}
                        >
                          ✗ Missed / Saved
                        </button>
                      </div>
                    </div>
                    {timelinePenaltyShotResult === 'missed' ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Miss Reason
                        </label>
                        <select
                          value={timelineMissReason}
                          onChange={(e) => setTimelineMissReason(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                        >
                          <option value="Saved by Goalie">Saved by Goalie</option>
                          <option value="Missed Net (Wide / High)">Missed Net (Wide / High)</option>
                          <option value="Hit Post / Crossbar">Hit Post / Crossbar</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Defending Goalie (Optional)
                        </label>
                        <input
                          type="text"
                          value={timelineGoalie}
                          onChange={(e) => setTimelineGoalie(e.target.value)}
                          placeholder="e.g. Tristan Jarry"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Infraction
                      </label>
                      <select
                        value={timelineInfraction}
                        onChange={(e) => setTimelineInfraction(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Minutes (PIM)
                      </label>
                      <select
                        value={timelineMinutes}
                        onChange={(e) => setTimelineMinutes(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                      >
                        <option value={2}>2 Min Minor</option>
                        <option value={4}>4 Min Double Minor</option>
                        <option value={5}>5 Min Major</option>
                        <option value={10}>10 Min Misconduct</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Checkbox Options & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
                {timelineType === 'goal' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={timelineAutoScore}
                      onChange={(e) => setTimelineAutoScore(e.target.checked)}
                      className="rounded text-blue-600 cursor-pointer"
                    />
                    <span>Automatically increment team score (+1)</span>
                  </label>
                )}
                {timelineType === 'penalty' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={timelineAutoPP}
                      onChange={(e) => setTimelineAutoPP(e.target.checked)}
                      className="rounded text-blue-600 cursor-pointer"
                    />
                    <span>Automatically activate opponent Power Play</span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Add Event to Live Timeline</span>
              </button>
            </div>
          </form>

          {/* List of currently recorded timeline events */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Recorded Timeline Incidents ({(matchState.events || []).length})
            </h4>

            {(!matchState.events || matchState.events.length === 0) ? (
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center text-xs text-gray-400">
                No timeline events recorded yet for this fixture. Use the form above to add goals and penalties.
              </div>
            ) : (
              <div className="space-y-2">
                {matchState.events.map((evt) => {
                  const isGoal = evt.type === 'goal';
                  const isPenalty = evt.type === 'penalty';
                  const isHome = evt.team === 'home';
                  const evtTeamName = isHome ? (matchState.home?.name || 'Home') : (matchState.away?.name || 'Away');

                  return (
                    <div
                      key={evt.id}
                      className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-bold text-gray-500 w-12 shrink-0">{evt.time || '00:00'}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 w-8 shrink-0">{evt.period || 'P1'}</span>
                        <div className="min-w-0">
                          <span className={`font-bold uppercase ${
                            isGoal ? (isHome ? 'text-blue-600' : 'text-amber-600') : isPenalty ? 'text-gray-900' : 'text-purple-600'
                          }`}>
                            {isGoal ? 'Goal' : isPenalty ? `${evt.penaltyMin || 2}m Penalty` : 'Timeout'}:
                          </span>
                          <span className="font-semibold text-gray-800 ml-1.5">
                            {isGoal ? evt.scorer : isPenalty ? `${evt.penaltyPlayer} (${evt.penaltyReason || 'Tripping'})` : evtTeamName}
                          </span>
                          {isGoal && evt.assist && (
                            <span className="text-gray-400 ml-1">(Assist: {evt.assist})</span>
                          )}
                          <span className="text-gray-400 ml-2 font-medium">• {evtTeamName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdminDeleteIncident(evt.id, isGoal)}
                        className="px-2.5 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 5: USER ROLES & REMOTE ACCESS PERMISSIONS --- */}
      {activeTab === 'users' && (
        <div className="pt-6 space-y-6">
          <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>User Permissions & Remote Access Control</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Control which accounts have permission to operate the live scoreboard and game clock. Regular spectator accounts cannot edit scores.
                </p>
              </div>

              {/* Quick Summary Counts (Clean text) */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-blue-700 font-bold">
                  {registeredUsers.filter(u => u.canControlRemote).length} Operators
                </span>
                <span className="text-gray-500 font-medium">
                  • {registeredUsers.filter(u => !u.canControlRemote).length} Spectators
                </span>
              </div>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {registeredUsers.map((user) => {
                const isMasterAdmin = user.username === 'admin';
                const hasRemote = user.canControlRemote === true || user.role === 'admin' || user.role === 'operator';

                return (
                  <div key={user.id || user.username} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isMasterAdmin
                          ? 'bg-blue-600 text-white'
                          : hasRemote
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{user.name}</span>
                          <span className="text-[11px] font-mono text-gray-400">@{user.username}</span>
                          {isMasterAdmin ? (
                            <span className="text-blue-600 text-[10px] font-black uppercase">
                              • ADMIN
                            </span>
                          ) : hasRemote ? (
                            <span className="text-emerald-600 text-[10px] font-black uppercase">
                              • OPERATOR
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px] font-bold uppercase">
                              • SPECTATOR
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isMasterAdmin ? (
                        <span className="text-xs font-semibold text-gray-400 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                          Permanent Admin
                        </span>
                      ) : hasRemote ? (
                        <button
                          type="button"
                          onClick={() => handleToggleUserAccess(user.id || user.username, user.name)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-red-200 flex items-center gap-1.5"
                          title="Revoke remote control permissions"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Revoke Remote Access</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleUserAccess(user.id || user.username, user.name)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1.5"
                          title="Grant remote control permissions"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Grant Remote Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
              <strong>Access Policy:</strong> Only accounts with <strong>Admin</strong> or <strong>Operator</strong> privileges can access the live Remote Control scoreboard. <strong>Spectator</strong> users can track games, rosters, and live stats, but cannot start/stop the clock or log scores.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
