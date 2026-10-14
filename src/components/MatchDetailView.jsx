import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Calendar, 
  Info, 
  User, 
  Radio, 
  Trophy 
} from 'lucide-react';
import { NHL_TEAMS, NHL_STANDINGS, NHL_LINEUPS, getTeamLineup } from '../constants/hockeyData';
import { useGameClock } from '../hooks/useGameClock';
import { formatPeriodName } from '../utils/timeFormatter';
import { MatchTimeline } from './MatchTimeline';

export function MatchDetailView({ matchState, onBackToList, onOpenRemote, isLoggedIn, onOpenLogin }) {
  const [activeTab, setActiveTab] = useState('Overview');

  // Precision game clock
  const { formattedTime, isRunning } = useGameClock(matchState.clock);

  const homeTeamId = matchState.home?.id;
  const awayTeamId = matchState.away?.id;

  const homeCrest = NHL_TEAMS[homeTeamId]?.crestSvg || matchState.home?.crestSvg || NHL_TEAMS.blackhawks.crestSvg;
  const awayCrest = NHL_TEAMS[awayTeamId]?.crestSvg || matchState.away?.crestSvg || NHL_TEAMS.penguins.crestSvg;

  const homeName = matchState.home?.name || 'Home Team';
  const awayName = matchState.away?.name || 'Away Team';
  const homeScore = matchState.home?.score ?? 0;
  const awayScore = matchState.away?.score ?? 0;

  const statusDisplay = matchState.period === 'FT'
    ? 'Full Time'
    : matchState.period === 'UPCOMING'
      ? `Scheduled • ${matchState.dateTime?.split(' ').pop() || '19:00'}`
      : isRunning
        ? `LIVE • ${formatPeriodName(matchState.period)} (${formattedTime})`
        : `${formatPeriodName(matchState.period)} (${formattedTime})`;

  // Determine whether lineups were declared for this match
  const isHomeLineupDeclared = useMemo(() => {
    if (matchState.lineupsDeclared === false) return false;
    if (matchState.home?.lineup && Array.isArray(matchState.home.lineup)) {
      return matchState.home.lineup.length > 0;
    }
    // If upcoming match and no explicit lineup attached, lineup is not declared
    if (matchState.period === 'UPCOMING') return false;
    // Known NHL team with declared lineup
    return Boolean(homeTeamId && NHL_LINEUPS[homeTeamId]);
  }, [matchState.lineupsDeclared, matchState.home?.lineup, matchState.period, homeTeamId]);

  const homeLineup = useMemo(() => {
    if (matchState.home?.lineup && matchState.home.lineup.length > 0) {
      return matchState.home.lineup;
    }
    if (isHomeLineupDeclared) {
      return getTeamLineup(homeTeamId, homeName);
    }
    return [];
  }, [matchState.home?.lineup, isHomeLineupDeclared, homeTeamId, homeName]);

  const isAwayLineupDeclared = useMemo(() => {
    if (matchState.lineupsDeclared === false) return false;
    if (matchState.away?.lineup && Array.isArray(matchState.away.lineup)) {
      return matchState.away.lineup.length > 0;
    }
    if (matchState.period === 'UPCOMING') return false;
    return Boolean(awayTeamId && NHL_LINEUPS[awayTeamId]);
  }, [matchState.lineupsDeclared, matchState.away?.lineup, matchState.period, awayTeamId]);

  const awayLineup = useMemo(() => {
    if (matchState.away?.lineup && matchState.away.lineup.length > 0) {
      return matchState.away.lineup;
    }
    if (isAwayLineupDeclared) {
      return getTeamLineup(awayTeamId, awayName);
    }
    return [];
  }, [matchState.away?.lineup, isAwayLineupDeclared, awayTeamId, awayName]);

  // Goal Events for this specific match
  const matchEvents = useMemo(() => {
    if (matchState.events && matchState.events.length > 0) {
      return matchState.events;
    }

    // If no explicit events array, generate realistic goal timeline based on the score and period breakdown
    const generated = [];
    let evtId = 1;

    const p1Home = matchState.periodScores?.p1?.home ?? 0;
    const p1Away = matchState.periodScores?.p1?.away ?? 0;
    const p2Home = matchState.periodScores?.p2?.home ?? 0;
    const p2Away = matchState.periodScores?.p2?.away ?? 0;
    const p3Home = matchState.periodScores?.p3?.home ?? 0;
    const p3Away = matchState.periodScores?.p3?.away ?? 0;
    const otHome = matchState.periodScores?.ot?.home ?? 0;
    const otAway = matchState.periodScores?.ot?.away ?? 0;

    let runningHome = 0;
    let runningAway = 0;

    const addGoals = (count, team, period, baseMinute, lineup) => {
      for (let i = 0; i < count; i++) {
        if (team === 'home') runningHome++;
        else runningAway++;

        const player = lineup[(i + 1) % lineup.length] || lineup[1];
        const assistPlayer = lineup[(i + 2) % lineup.length] || lineup[2];
        const minute = Math.min(19, baseMinute + i * 4 + 2);
        const second = (15 + i * 18) % 60;
        const timeStr = `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

        generated.push({
          id: evtId++,
          time: timeStr,
          period,
          team,
          scorer: player.name,
          assist: assistPlayer.name,
          text: `Goal! ${team === 'home' ? homeName : awayName} (${runningHome} - ${runningAway})`
        });
      }
    };

    if (p1Home > 0) addGoals(p1Home, 'home', 'P1', 4, homeLineup);
    if (p1Away > 0) addGoals(p1Away, 'away', 'P1', 8, awayLineup);
    if (p2Home > 0) addGoals(p2Home, 'home', 'P2', 3, homeLineup);
    if (p2Away > 0) addGoals(p2Away, 'away', 'P2', 9, awayLineup);
    if (p3Home > 0) addGoals(p3Home, 'home', 'P3', 2, homeLineup);
    if (p3Away > 0) addGoals(p3Away, 'away', 'P3', 7, awayLineup);
    if (otHome > 0) addGoals(otHome, 'home', 'OT', 2, homeLineup);
    if (otAway > 0) addGoals(otAway, 'away', 'OT', 3, awayLineup);

    return generated;
  }, [matchState.events, matchState.periodScores, homeName, awayName, homeLineup, awayLineup]);

  // Head to Head past meetings for these two teams
  const h2hMeetings = useMemo(() => {
    return [
      { date: '15 Feb 2026', home: awayName, away: homeName, score: '3 - 2' },
      { date: '10 Nov 2025', home: homeName, away: awayName, score: '4 - 2' },
      { date: '06 Apr 2025', home: awayName, away: homeName, score: '2 - 5' },
      { date: '12 Jan 2025', home: homeName, away: awayName, score: '3 - 1' }
    ];
  }, [homeName, awayName]);

  // Statistics for this specific match
  const matchStats = useMemo(() => {
    const totalHomeShots = matchState.home?.shots ?? (homeScore ? homeScore * 5 + 12 : 28);
    const totalAwayShots = matchState.away?.shots ?? (awayScore ? awayScore * 5 + 10 : 25);
    const shotsSum = totalHomeShots + totalAwayShots;
    const homeShotsPct = shotsSum > 0 ? Math.round((totalHomeShots / shotsSum) * 100) : 50;

    return [
      { 
        label: 'Shots on Goal', 
        home: totalHomeShots, 
        away: totalAwayShots,
        homePct: homeShotsPct
      },
      { 
        label: 'Power Play Goals', 
        home: homeScore > 2 ? '2 / 4' : (homeScore > 0 ? '1 / 3' : '0 / 2'), 
        away: awayScore > 2 ? '1 / 3' : (awayScore > 0 ? '1 / 4' : '0 / 3'), 
        homePct: 52 
      },
      { 
        label: 'Penalty Minutes (PIM)', 
        home: `${Math.max(4, (homeScore + 2) * 2)} min`, 
        away: `${Math.max(4, (awayScore + 3) * 2)} min`, 
        homePct: 45 
      },
      { 
        label: 'Faceoff Win %', 
        home: '53%', 
        away: '47%', 
        homePct: 53 
      },
      { 
        label: 'Hits', 
        home: `${20 + (homeScore % 7)}`, 
        away: `${18 + (awayScore % 9)}`, 
        homePct: 51 
      }
    ];
  }, [matchState.home?.shots, matchState.away?.shots, homeScore, awayScore]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button 
          onClick={onBackToList}
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs hover:bg-gray-50 transition-colors"
        >
          <span>Back</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Main Banner Card & Sub-Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 relative overflow-hidden">
            {/* Matchup Header with Giant Score */}
            <div className="flex items-center justify-between gap-4 sm:gap-6 my-2">
              {/* Home Team */}
              <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4 text-right min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug truncate">
                  {homeName}
                </h2>
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center drop-shadow-xs"
                  dangerouslySetInnerHTML={{ __html: homeCrest }}
                />
              </div>

              {/* Center Score & Status (No pill badge, clean typography) */}
              <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-4">
                <div className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-2 sm:gap-3">
                  <span className="transition-transform duration-300 inline-block">{homeScore}</span>
                  <span className="text-gray-300 font-light">-</span>
                  <span className="transition-transform duration-300 inline-block">{awayScore}</span>
                </div>

                {/* Clean status text without pill wrapper */}
                <div className="mt-2 text-center">
                  <span className={`text-xs font-semibold tracking-wide ${
                    matchState.period === 'FT'
                      ? 'text-gray-400'
                      : matchState.period === 'UPCOMING'
                        ? 'text-blue-600 font-bold'
                        : isRunning
                          ? 'text-emerald-600 font-mono font-bold'
                          : 'text-amber-600 font-bold'
                  }`}>
                    {statusDisplay}
                  </span>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex-1 flex items-center justify-start gap-3 sm:gap-4 text-left min-w-0">
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center drop-shadow-xs"
                  dangerouslySetInnerHTML={{ __html: awayCrest }}
                />
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug truncate">
                  {awayName}
                </h2>
              </div>
            </div>

            {/* Stadium & Date Footer Bar */}
            <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-500 font-normal">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{matchState.venue || 'United Center'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{matchState.dateTime || matchState.date || 'Wed, Oct 14, 2026'}</span>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="mt-8 -mx-6 sm:-mx-8 px-6 sm:px-8 border-t border-gray-200 flex items-center gap-6 overflow-x-auto text-sm font-semibold">
              {[
                'Overview',
                'Timeline',
                'Lineups',
                'Table',
                'Statistics',
                'Head to Head'
              ].map(tabName => {
                const isActive = activeTab === tabName;
                return (
                  <button
                    key={tabName}
                    onClick={() => setActiveTab(tabName)}
                    className={`py-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-gray-900 text-gray-900 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span>{tabName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                {/* Period Scoring Breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">
                    Period Scoring Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 text-xs">
                          <th className="py-2 font-medium">Team</th>
                          <th className="py-2 text-center font-medium">1st</th>
                          <th className="py-2 text-center font-medium">2nd</th>
                          <th className="py-2 text-center font-medium">3rd</th>
                          {(matchState.periodScores?.ot?.home > 0 || matchState.periodScores?.ot?.away > 0 || matchState.period === 'OT') && (
                            <th className="py-2 text-center font-medium">OT</th>
                          )}
                          <th className="py-2 text-center font-bold text-gray-800">T</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <tr>
                          <td className="py-3 font-semibold text-gray-900">
                            {homeName}
                          </td>
                          <td className="py-3 text-center text-gray-700">{matchState.periodScores?.p1?.home ?? 0}</td>
                          <td className="py-3 text-center text-gray-700">{matchState.periodScores?.p2?.home ?? 0}</td>
                          <td className="py-3 text-center text-gray-700">{matchState.periodScores?.p3?.home ?? 0}</td>
                          {(matchState.periodScores?.ot?.home > 0 || matchState.periodScores?.ot?.away > 0 || matchState.period === 'OT') && (
                            <td className="py-3 text-center text-gray-700">{matchState.periodScores?.ot?.home ?? 0}</td>
                          )}
                          <td className="py-3 text-center font-black text-gray-900 text-base">{homeScore}</td>
                        </tr>
                        <tr>
                          <td className="py-3 font-semibold text-gray-900">
                            {awayName}
                          </td>
                          <td className="py-3 text-center text-gray-700">{matchState.periodScores?.p1?.away ?? 0}</td>
                          <td className="py-3 text-center text-gray-700">{matchState.periodScores?.p2?.away ?? 0}</td>
                          <td className="py-3 text-center text-gray-700">{matchState.periodScores?.p3?.away ?? 0}</td>
                          {(matchState.periodScores?.ot?.home > 0 || matchState.periodScores?.ot?.away > 0 || matchState.period === 'OT') && (
                            <td className="py-3 text-center text-gray-700">{matchState.periodScores?.ot?.away ?? 0}</td>
                          )}
                          <td className="py-3 text-center font-black text-gray-900 text-base">{awayScore}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Match Goal Events Timeline */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Match Events & Goals
                    </h3>
                    <button
                      onClick={() => setActiveTab('Timeline')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      View Full Timeline →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {matchEvents.length > 0 ? (
                      matchEvents.map((evt) => (
                        <div 
                          key={evt.id} 
                          className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/70 border border-gray-100"
                        >
                          <span className="text-xs font-mono font-bold text-gray-500 w-12 shrink-0">
                            {evt.time}
                          </span>
                          <span className="text-xs font-bold text-gray-600 uppercase shrink-0">
                            {evt.period}
                          </span>
                          <div className="flex-1 text-sm font-medium text-gray-800">
                            <span className="font-bold">{evt.scorer}</span>
                            {evt.assist && <span className="text-gray-500 text-xs ml-2">({evt.assist})</span>}
                          </div>
                          <span className="text-xs font-semibold text-blue-600">Goal</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-gray-400 text-xs">
                        No goals recorded yet. Match is {matchState.period === 'UPCOMING' ? 'scheduled for puck drop.' : 'tied at 0 - 0.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TIMELINE TAB */}
            {activeTab === 'Timeline' && (
              <MatchTimeline 
                matchState={matchState} 
                homeName={homeName} 
                awayName={awayName} 
                isRunning={isRunning} 
                formattedTime={formattedTime} 
              />
            )}

            {/* 3. LINEUPS TAB */}
            {activeTab === 'Lineups' && (
              <div>
                {!isHomeLineupDeclared && !isAwayLineupDeclared ? (
                  <div className="py-12 px-6 rounded-2xl bg-gray-50/70 border border-gray-100 text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Match Rosters</span>
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      Starting Lineups Not Declared
                    </h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Official starting rosters for {homeName} and {awayName} have not been declared yet. Starters are typically submitted 30–60 minutes prior to puck drop.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Team Lineup */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                          {homeName} Starters
                        </h4>
                        <span className={`text-xs font-semibold ${
                          isHomeLineupDeclared ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {isHomeLineupDeclared ? 'Declared' : 'Not Declared'}
                        </span>
                      </div>

                      {isHomeLineupDeclared && homeLineup.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {homeLineup.map(player => (
                            <div key={player.number} className="py-2.5 flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 font-mono text-xs font-bold flex items-center justify-center">
                                  #{player.number}
                                </span>
                                <span className="font-semibold text-gray-900">{player.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-bold">{player.pos}</span>
                                <span className="text-xs text-gray-400">{player.nationality}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</span>
                          <h5 className="text-sm font-bold text-gray-700">Lineup Not Declared</h5>
                          <p className="text-xs text-gray-400 mt-1">
                            Starting lineup for {homeName} has not been declared yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Away Team Lineup */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                          {awayName} Starters
                        </h4>
                        <span className={`text-xs font-semibold ${
                          isAwayLineupDeclared ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                          {isAwayLineupDeclared ? 'Declared' : 'Not Declared'}
                        </span>
                      </div>

                      {isAwayLineupDeclared && awayLineup.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {awayLineup.map(player => (
                            <div key={player.number} className="py-2.5 flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 font-mono text-xs font-bold flex items-center justify-center">
                                  #{player.number}
                                </span>
                                <span className="font-semibold text-gray-900">{player.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-bold">{player.pos}</span>
                                <span className="text-xs text-gray-400">{player.nationality}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</span>
                          <h5 className="text-sm font-bold text-gray-700">Lineup Not Declared</h5>
                          <p className="text-xs text-gray-400 mt-1">
                            Starting lineup for {awayName} has not been declared yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. TABLE / STANDINGS TAB */}
            {activeTab === 'Table' && (
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                  NHL Standings
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs">
                        <th className="py-2 font-medium">#</th>
                        <th className="py-2 font-medium">Team</th>
                        <th className="py-2 text-center font-medium">GP</th>
                        <th className="py-2 text-center font-medium">W</th>
                        <th className="py-2 text-center font-medium">L</th>
                        <th className="py-2 text-center font-medium">OTL</th>
                        <th className="py-2 text-center font-bold text-gray-900">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {NHL_STANDINGS.map((row) => {
                        const isMatchTeam = row.team.toLowerCase().includes(homeName.toLowerCase()) || 
                                            row.team.toLowerCase().includes(awayName.toLowerCase());
                        return (
                          <tr key={row.team} className={isMatchTeam ? 'bg-blue-50/50 font-semibold' : 'hover:bg-gray-50'}>
                            <td className="py-2.5 font-bold text-gray-400 text-xs">{row.pos}</td>
                            <td className="py-2.5 font-semibold text-gray-900 flex items-center gap-2">
                              {row.team}
                              {isMatchTeam && (
                                <span className="text-[11px] font-bold text-blue-600">
                                  (Match)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-center text-gray-600">{row.gp}</td>
                            <td className="py-2.5 text-center text-gray-600">{row.w}</td>
                            <td className="py-2.5 text-center text-gray-600">{row.l}</td>
                            <td className="py-2.5 text-center text-gray-600">{row.otl}</td>
                            <td className="py-2.5 text-center font-black text-gray-900">{row.pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. STATISTICS TAB */}
            {activeTab === 'Statistics' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                  Match Statistics
                </h4>
                {matchStats.map((stat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{stat.home}</span>
                      <span className="text-gray-400 font-medium">{stat.label}</span>
                      <span>{stat.away}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full flex overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-l-full" style={{ width: `${stat.homePct}%` }}></div>
                      <div className="bg-amber-500 h-full rounded-r-full" style={{ width: `${100 - stat.homePct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. HEAD TO HEAD TAB */}
            {activeTab === 'Head to Head' && (
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                  Recent Meetings Between {homeName} & {awayName}
                </h4>
                <div className="space-y-2">
                  {h2hMeetings.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-sm">
                      <span className="text-xs text-gray-400 font-medium">{item.date}</span>
                      <span className="font-semibold text-gray-800">
                        {item.home} <span className="font-bold text-gray-900 mx-2">{item.score}</span> {item.away}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Match Details Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-100">
            {/* Header with info icon */}
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
              <Info className="w-4 h-4 text-gray-700" />
              <h3 className="font-bold text-gray-900 text-sm">Match Details</h3>
            </div>

            {/* Stadium */}
            <div className="flex items-start gap-3 py-3 border-b border-gray-50">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-gray-400 font-normal">Stadium</div>
                <div className="text-sm font-semibold text-gray-800">
                  {matchState.venue || 'United Center'}
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3 py-3 border-b border-gray-50">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-gray-400 font-normal">Date & Time</div>
                <div className="text-sm font-semibold text-gray-800">
                  {matchState.dateTime || matchState.date || 'Wed, Oct 14, 2026 19:00'}
                </div>
              </div>
            </div>

            {/* Referee */}
            <div className="flex items-start gap-3 py-3 border-b border-gray-50">
              <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-gray-400 font-normal">Referee</div>
                <div className="text-sm font-semibold text-gray-800">
                  {matchState.referee || 'Furlatt E.'}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3 py-3 border-b border-gray-50">
              <Radio className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-gray-400 font-normal">Status</div>
                <div className="text-sm font-semibold text-gray-800">
                  {statusDisplay}
                </div>
              </div>
            </div>

            {/* League & Country */}
            <div className="flex items-start gap-3 py-3">
              <Trophy className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-gray-400 font-normal">Competition</div>
                <div className="text-sm font-semibold text-gray-800">
                  {matchState.league || 'NHL'} • {matchState.country || 'USA'}
                </div>
              </div>
            </div>

            {/* Operator Quick Action */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              {isLoggedIn ? (
                <div>
                  <button
                    onClick={onOpenRemote}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <span>Open Remote Control</span>
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
                    Adjust scores, start clock & periods in real time
                  </p>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="group w-full flex items-center justify-center px-4 py-2.5 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-none border border-gray-300 hover:border-blue-600 text-xs font-semibold transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
                >
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
