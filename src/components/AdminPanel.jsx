import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

export function AdminPanel({ matchState, scoreboard, remainingSeconds, isRunning }) {
  const [activeTab, setActiveTab] = useState('time'); // 'time', 'score', 'schedule'
  const [notification, setNotification] = useState('');

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

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            Administrator Master Controls
          </h3>
          <p className="text-[11px] text-gray-400">
            Direct real-time override for time correction, scores, and schedule
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('time')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'time'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Correct Time</span>
          </button>

          <button
            onClick={() => setActiveTab('score')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'score'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Change Score</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'schedule'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Change Schedule</span>
          </button>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Total Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center font-mono font-black text-2xl py-2 bg-white border border-gray-200 rounded-xl focus:border-red-500 outline-none"
                  />
                </div>
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
              </div>
            </div>

            {/* Away Direct Score */}
            <div className="p-4 rounded-2xl bg-yellow-50/40 border border-yellow-100">
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider block mb-2">
                {matchState.away?.name || 'Away Team'}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Total Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center font-mono font-black text-2xl py-2 bg-white border border-gray-200 rounded-xl focus:border-yellow-500 outline-none"
                  />
                </div>
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
    </div>
  );
}
