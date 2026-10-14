import React, { useState, useMemo } from 'react';
import { getTeamLineup } from '../constants/hockeyData';

export function MatchTimeline({ matchState, homeName, awayName, isRunning, formattedTime }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'goals', 'penalties'
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const homeLineup = useMemo(() => {
    return getTeamLineup(matchState?.home?.id, homeName);
  }, [matchState?.home?.id, homeName]);

  const awayLineup = useMemo(() => {
    return getTeamLineup(matchState?.away?.id, awayName);
  }, [matchState?.away?.id, awayName]);

  // Compute all chronological events for this match
  const allEvents = useMemo(() => {
    if (matchState?.events && matchState.events.length > 0) {
      return matchState.events;
    }

    // Procedural generation if events array is not explicitly stored
    const generated = [];
    let evtId = 1;

    const p1H = matchState?.periodScores?.p1?.home ?? 0;
    const p1A = matchState?.periodScores?.p1?.away ?? 0;
    const p2H = matchState?.periodScores?.p2?.home ?? 0;
    const p2A = matchState?.periodScores?.p2?.away ?? 0;
    const p3H = matchState?.periodScores?.p3?.home ?? 0;
    const p3A = matchState?.periodScores?.p3?.away ?? 0;
    const otH = matchState?.periodScores?.ot?.home ?? 0;
    const otA = matchState?.periodScores?.ot?.away ?? 0;

    let scoreH = 0;
    let scoreA = 0;

    // Helper to add penalty
    const addPenalty = (period, minute, team, player, reason) => {
      generated.push({
        id: evtId++,
        time: `${String(minute).padStart(2, '0')}:30`,
        minute,
        period,
        team,
        type: 'penalty',
        penaltyPlayer: player.name,
        penaltyMin: 2,
        penaltyReason: reason,
        text: `2 Min Penalty (${reason}) - ${player.name} (${team === 'home' ? homeName : awayName})`
      });
    };

    // Helper to add goals
    const addGoals = (count, team, period, startMin, lineup) => {
      for (let i = 0; i < count; i++) {
        if (team === 'home') scoreH++;
        else scoreA++;

        const player = lineup[(i + 1) % lineup.length] || lineup[1];
        const assist1 = lineup[(i + 2) % lineup.length] || lineup[2];
        const minute = Math.min(19, startMin + i * 5 + 2);
        const second = (14 + i * 21) % 60;
        const timeStr = `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

        generated.push({
          id: evtId++,
          time: timeStr,
          minute,
          period,
          team,
          type: 'goal',
          scorer: player.name,
          assist: assist1.name,
          score: `${scoreH} - ${scoreA}`,
          text: `Goal! ${team === 'home' ? homeName : awayName} (${scoreH} - ${scoreA})`
        });
      }
    };

    // Period 1
    if (p1H > 0) addGoals(p1H, 'home', 'P1', 3, homeLineup);
    if (p1A > 0 || p1H > 0) addPenalty('P1', 11, 'home', homeLineup[4] || homeLineup[0], 'Tripping');
    if (p1A > 0) addGoals(p1A, 'away', 'P1', 7, awayLineup);

    // Period 2
    if (p2A > 0 || p2H > 0) addPenalty('P2', 8, 'away', awayLineup[4] || awayLineup[0], 'Slashing');
    if (p2H > 0) addGoals(p2H, 'home', 'P2', 4, homeLineup);
    if (p2A > 0) addGoals(p2A, 'away', 'P2', 10, awayLineup);

    // Period 3
    if (p3H > 0) addGoals(p3H, 'home', 'P3', 2, homeLineup);
    if (p3A > 0 || p3H > 0) addPenalty('P3', 14, 'home', homeLineup[5] || homeLineup[1], 'Roughing');
    if (p3A > 0) addGoals(p3A, 'away', 'P3', 8, awayLineup);

    // Overtime
    if (otH > 0) addGoals(otH, 'home', 'OT', 2, homeLineup);
    if (otA > 0) addGoals(otA, 'away', 'OT', 3, awayLineup);

    return generated;
  }, [matchState?.events, matchState?.periodScores, homeName, awayName, homeLineup, awayLineup]);

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'goals') return allEvents.filter(e => e.type !== 'penalty');
    if (activeFilter === 'penalties') return allEvents.filter(e => e.type === 'penalty');
    return allEvents;
  }, [allEvents, activeFilter]);

  // Group events by period
  const periodGroups = useMemo(() => {
    const groups = {
      P1: { name: '1st Period', events: [] },
      P2: { name: '2nd Period', events: [] },
      P3: { name: '3rd Period', events: [] },
      OT: { name: 'Overtime', events: [] },
      SO: { name: 'Shootout', events: [] }
    };

    filteredEvents.forEach(evt => {
      const p = evt.period || 'P1';
      if (groups[p]) {
        groups[p].events.push(evt);
      } else {
        groups.P1.events.push(evt);
      }
    });

    return groups;
  }, [filteredEvents]);

  // Calculate position percentage along the 60-minute regulation timeline
  const calculateTimelinePosition = (period, minuteStr) => {
    let min = parseInt(minuteStr, 10);
    if (isNaN(min)) {
      min = parseInt(String(minuteStr).split(':')[0], 10) || 5;
    }

    let totalGameMinutes = 0;
    if (period === 'P1') {
      totalGameMinutes = Math.min(20, min);
    } else if (period === 'P2') {
      totalGameMinutes = 20 + Math.min(20, min);
    } else if (period === 'P3') {
      totalGameMinutes = 40 + Math.min(20, min);
    } else if (period === 'OT') {
      totalGameMinutes = 60 + Math.min(5, min);
    }

    // 60 minutes = 100% (or 65 if OT played)
    const hasOT = matchState?.period === 'OT' || (matchState?.periodScores?.ot?.home > 0 || matchState?.periodScores?.ot?.away > 0);
    const maxMins = hasOT ? 65 : 60;
    return Math.max(2, Math.min(98, (totalGameMinutes / maxMins) * 100));
  };

  const isUpcoming = matchState?.period === 'UPCOMING';
  const hasOT = matchState?.period === 'OT' || (matchState?.periodScores?.ot?.home > 0 || matchState?.periodScores?.ot?.away > 0);

  return (
    <div className="space-y-6">
      {/* 1. Header & Timeline Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            Match Incident Timeline
          </h3>
          <p className="text-xs text-gray-400">
            Chronological progression of goals, penalties, and period milestones
          </p>
        </div>

        {/* Filter Toggle Buttons (No icons in front of labels) */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>All Incidents</span>
          </button>
          <button
            onClick={() => setActiveFilter('goals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'goals'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Goals Only</span>
          </button>
          <button
            onClick={() => setActiveFilter('penalties')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'penalties'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Penalties</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Horizontal Match Progress Bar (0' - 60' Regulation) */}
      <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/70">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2.5">
          <span>Puck Drop (00:00)</span>
          <span className="font-mono text-gray-700">
            {isUpcoming ? 'Scheduled' : matchState?.period === 'FT' ? 'Full Time' : isRunning ? `LIVE • ${formattedTime}` : 'Paused'}
          </span>
          <span>{hasOT ? 'Overtime (65:00)' : '60:00 Final'}</span>
        </div>

        {/* Timeline Bar Track */}
        <div className="relative w-full h-4 bg-gray-200/80 rounded-full overflow-visible my-6">
          {/* Period Background Divisions */}
          <div className="absolute inset-0 flex rounded-full overflow-hidden">
            <div className="flex-1 bg-gray-200/50 border-r border-white/80" title="1st Period"></div>
            <div className="flex-1 bg-gray-200/50 border-r border-white/80" title="2nd Period"></div>
            <div className="flex-1 bg-gray-200/50 border-r border-white/80" title="3rd Period"></div>
            {hasOT && <div className="w-[8%] bg-amber-100/60" title="Overtime"></div>}
          </div>

          {/* Incident Pins along the timeline */}
          {allEvents.map((evt) => {
            const pos = calculateTimelinePosition(evt.period, evt.time || evt.minute);
            const isGoal = evt.type !== 'penalty';
            const isHome = evt.team === 'home';
            const isHovered = hoveredEvent?.id === evt.id;

            return (
              <div
                key={evt.id}
                onMouseEnter={() => setHoveredEvent(evt)}
                onMouseLeave={() => setHoveredEvent(null)}
                style={{ left: `${pos}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 group"
              >
                {/* Pin Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md transition-transform group-hover:scale-125 ${
                    isGoal
                      ? isHome
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : 'bg-amber-500 text-white ring-2 ring-amber-300'
                      : 'bg-gray-700 text-amber-300 ring-2 ring-gray-400'
                  }`}
                >
                  {isGoal ? (isHome ? 'H' : 'A') : 'P'}
                </div>

                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[11px] p-2.5 rounded-xl shadow-xl z-30 pointer-events-none animate-in fade-in zoom-in-95">
                    <div className="font-bold text-gray-300 flex justify-between">
                      <span>{evt.period} • {evt.time}</span>
                      <span>{evt.score || ''}</span>
                    </div>
                    <div className="font-bold text-white mt-1">
                      {isGoal ? `Goal: ${evt.scorer}` : `${evt.penaltyReason || 'Penalty'}`}
                    </div>
                    {evt.assist && (
                      <div className="text-[10px] text-gray-400 truncate">Assist: {evt.assist}</div>
                    )}
                    <div className="text-[10px] text-blue-400 font-semibold mt-0.5">
                      {isHome ? homeName : awayName}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-[11px] font-bold text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span>{homeName} Goal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>{awayName} Goal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-700"></span>
            <span>2 Min Penalty</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 font-normal">
            <span>• 20' & 40' Period Markers</span>
          </div>
        </div>
      </div>

      {/* 3. Chronological Incident Stream (Period-by-Period Timeline) */}
      <div className="space-y-6 pt-2">
        {isUpcoming ? (
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center text-gray-400 text-sm">
            This match is scheduled for puck drop at <strong className="text-gray-700">{matchState?.dateTime || '19:00'}</strong>.
            The live timeline stream will activate as soon as the match begins.
          </div>
        ) : allEvents.length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center text-gray-400 text-sm">
            Puck drop completed. No goals or penalties recorded yet (0 - 0).
          </div>
        ) : (
          ['P1', 'P2', 'P3', 'OT', 'SO'].map((periodKey) => {
            const group = periodGroups[periodKey];
            if (!group || (group.events.length === 0 && (periodKey === 'OT' || periodKey === 'SO'))) {
              return null;
            }

            return (
              <div key={periodKey} className="space-y-3">
                {/* Period Milestone Header */}
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-gray-900 text-white text-xs font-black rounded-lg uppercase tracking-wider">
                    {group.name}
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400 font-semibold">
                    {periodKey === 'P1' ? '00:00 - 20:00' : periodKey === 'P2' ? '20:00 - 40:00' : periodKey === 'P3' ? '40:00 - 60:00' : 'Overtime'}
                  </span>
                </div>

                {/* Period Events Stream */}
                {group.events.length === 0 ? (
                  <div className="py-3 px-4 rounded-xl bg-gray-50/60 text-gray-400 text-xs italic">
                    No incidents recorded in this period.
                  </div>
                ) : (
                  <div className="relative pl-6 sm:pl-8 space-y-3 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {group.events.map((evt) => {
                      const isGoal = evt.type !== 'penalty';
                      const isHome = evt.team === 'home';

                      return (
                        <div
                          key={evt.id}
                          className="relative flex items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-shadow"
                        >
                          {/* Timeline node dot */}
                          <div
                            className={`absolute -left-6 sm:-left-8 top-4 sm:top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                              isGoal
                                ? isHome ? 'bg-blue-600' : 'bg-amber-500'
                                : 'bg-gray-700'
                            }`}
                          ></div>

                          {/* Left: Time & Incident Badge */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-xs font-bold text-gray-500 w-12 shrink-0">
                              {evt.time}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                    isGoal
                                      ? isHome
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-amber-100 text-amber-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {isGoal ? 'Goal' : '2 Min Penalty'}
                                </span>

                                <span className="font-bold text-gray-900 text-sm truncate">
                                  {isGoal ? evt.scorer : evt.penaltyPlayer}
                                </span>
                              </div>

                              <div className="text-xs text-gray-500 mt-0.5 truncate">
                                {isGoal ? (
                                  evt.assist ? (
                                    <span>Assists: <strong className="text-gray-700">{evt.assist}</strong></span>
                                  ) : (
                                    <span>Unassisted</span>
                                  )
                                ) : (
                                  <span>Infraction: <strong className="text-gray-700">{evt.penaltyReason || 'Tripping'}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Team & Score Change */}
                          <div className="text-right shrink-0">
                            {isGoal && evt.score && (
                              <div className="font-mono font-black text-sm text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                                {evt.score}
                              </div>
                            )}
                            <div className="text-[11px] font-semibold text-gray-400 mt-0.5">
                              {isHome ? homeName : awayName}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
