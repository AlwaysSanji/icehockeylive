import React, { useState, useMemo } from 'react';
import { Calendar, Radio, CheckCircle2, Plus, ArrowRight, Shield, Zap } from 'lucide-react';
import { NHL_TEAMS } from '../constants/hockeyData';
import { useGameClock } from '../hooks/useGameClock';
import { UnifiedNavbar } from './UnifiedNavbar';
import { LeagueManager } from './LeagueManager';
import { BoxScoreTable } from './BoxScoreTable';

export function ScoreboardList({ 
  liveMatchState, 
  matches = [], 
  onSelectMatch,
  activeNavTab = 'live',
  onNavTabChange,
  canManageMatches = false,
  onOpenAddMatch,
  onOpenDeleteMatch,
  onOpenSearch,
  currentUser,
  currentView = 'list',
  onViewChange,
  onLogout,
  onOpenLogin
}) {
  // Clock for the live match row
  const { formattedTime, isRunning } = useGameClock(liveMatchState?.clock);

  // Status text for live match
  const liveStatusText = useMemo(() => {
    if (!liveMatchState) return 'LIVE';
    const period = String(liveMatchState.period || '1').toUpperCase();
    if (period === 'FT') return 'FT';
    if (isRunning) {
      return `LIVE ${formattedTime}`;
    }
    return `P${period} ${formattedTime}`;
  }, [liveMatchState, isRunning, formattedTime]);

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

  const liveMatches = useMemo(() => matches.filter(m => getMatchCategory(m) === 'live'), [matches]);
  const upcomingMatches = useMemo(() => matches.filter(m => getMatchCategory(m) === 'upcoming'), [matches]);
  const finishedMatches = useMemo(() => matches.filter(m => getMatchCategory(m) === 'finished'), [matches]);

  // Current category matches
  const displayedMatches = useMemo(() => {
    if (activeNavTab === 'live') return liveMatches;
    if (activeNavTab === 'upcoming') return upcomingMatches;
    if (activeNavTab === 'finished') return finishedMatches;
    return matches;
  }, [activeNavTab, liveMatches, upcomingMatches, finishedMatches, matches]);

  // Primary active match for box score / penalty preview
  const primaryActiveMatch = liveMatches[0] || (liveMatchState && getMatchCategory(liveMatchState) === 'live' ? liveMatchState : null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* 1. Unified Master Top Navbar */}
      <UnifiedNavbar
        activeNavTab={activeNavTab}
        onNavTabChange={onNavTabChange}
        liveCount={liveMatches.length}
        upcomingCount={upcomingMatches.length}
        finishedCount={finishedMatches.length}
        onOpenSearch={onOpenSearch}
      />

      {/* 2. LEAGUE VIEW (League Hub: Standings, Teams, Players) */}
      {activeNavTab === 'league' ? (
        <LeagueManager
          matches={matches}
          isReadOnly={!canManageMatches}
          initialSubTab="standings"
        />
      ) : (
        <div className="space-y-6">
          {/* Matches List Container */}
          {displayedMatches.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {activeNavTab === 'live' && `Active Live Fixtures (${displayedMatches.length})`}
                  {activeNavTab === 'upcoming' && `Scheduled Fixtures (${displayedMatches.length})`}
                  {activeNavTab === 'finished' && `Concluded Match Results (${displayedMatches.length})`}
                </span>
                <span className="text-[11px] text-gray-400 font-semibold">
                  Official Live Timetable
                </span>
              </div>

              {/* Match Cards Grid */}
              <div className="space-y-3.5">
                {displayedMatches.map((m) => {
                  const isCurrentLiveSync = primaryActiveMatch && m.id === primaryActiveMatch.id;
                  const homeId = m.home?.id || 'blackhawks';
                  const awayId = m.away?.id || 'penguins';
                  const homeName = m.home?.name || 'Home Team';
                  const awayName = m.away?.name || 'Away Team';
                  const homeCrest = NHL_TEAMS[homeId]?.crestSvg || m.home?.crestSvg;
                  const awayCrest = NHL_TEAMS[awayId]?.crestSvg || m.away?.crestSvg;
                  const category = getMatchCategory(m);

                  const homeScore = isCurrentLiveSync ? (primaryActiveMatch.home?.score ?? 0) : (m.home?.score ?? 0);
                  const awayScore = isCurrentLiveSync ? (primaryActiveMatch.away?.score ?? 0) : (m.away?.score ?? 0);

                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMatch(m.id)}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:border-blue-400/80 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Status Badge & Venue */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 border-b sm:border-b-0 pb-2 sm:pb-0 border-gray-100">
                          {category === 'live' ? (
                            <span className="text-xs font-black uppercase tracking-wider text-red-600">
                              {isCurrentLiveSync ? liveStatusText : `Live P${m.period || '1'}`}
                            </span>
                          ) : category === 'upcoming' ? (
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              {m.dateTime || m.date || 'Scheduled'}
                            </span>
                          ) : (
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Final (FT)
                            </span>
                          )}

                          <span className="text-xs text-gray-400 font-medium truncate max-w-[150px]">
                            {m.venue || 'United Center'}
                          </span>
                        </div>

                        {/* Matchup Header */}
                        <div className="flex-1 flex items-center justify-between sm:justify-center gap-6 sm:px-4">
                          {/* Home Team */}
                          <div className="flex items-center gap-3 min-w-0 flex-1 justify-start sm:justify-end text-left sm:text-right">
                            <span className="font-extrabold text-gray-900 text-sm sm:text-base truncate max-w-[150px]">
                              {homeName}
                            </span>
                            {homeCrest && (
                              <div 
                                className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0"
                                dangerouslySetInnerHTML={{ __html: homeCrest }}
                              />
                            )}
                          </div>

                          {/* Scores / VS */}
                          <div className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 font-mono font-black text-sm sm:text-base shrink-0 flex items-center gap-2">
                            {category === 'upcoming' ? (
                              <span className="text-gray-400 text-xs font-sans font-bold uppercase tracking-wider">VS</span>
                            ) : (
                              <>
                                <span className={homeScore > awayScore ? 'text-blue-600' : 'text-gray-900'}>{homeScore}</span>
                                <span className="text-gray-300">-</span>
                                <span className={awayScore > homeScore ? 'text-amber-600' : 'text-gray-900'}>{awayScore}</span>
                              </>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-3 min-w-0 flex-1 justify-end sm:justify-start text-right sm:text-left">
                            {awayCrest && (
                              <div 
                                className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0"
                                dangerouslySetInnerHTML={{ __html: awayCrest }}
                              />
                            )}
                            <span className="font-extrabold text-gray-900 text-sm sm:text-base truncate max-w-[150px]">
                              {awayName}
                            </span>
                          </div>
                        </div>

                        {/* Action Link */}
                        <div className="flex items-center justify-end">
                          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Details <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Box Score Table Preview for Primary Live / Finished Match */}
              {(activeNavTab === 'live' || activeNavTab === 'finished') && displayedMatches[0] && (
                <div className="pt-2">
                  <BoxScoreTable matchState={primaryActiveMatch || displayedMatches[0]} />
                </div>
              )}
            </div>
          ) : (
            /* Empty State for Category */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-gray-300 text-center shadow-xs">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                activeNavTab === 'live' ? 'bg-red-50 text-red-600 border border-red-100' :
                activeNavTab === 'upcoming' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                {activeNavTab === 'live' && <Radio className="w-7 h-7" />}
                {activeNavTab === 'upcoming' && <Calendar className="w-7 h-7" />}
                {activeNavTab === 'finished' && <CheckCircle2 className="w-7 h-7" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {activeNavTab === 'live' && 'No Live Matches In Progress'}
                {activeNavTab === 'upcoming' && 'No Upcoming Matches Scheduled'}
                {activeNavTab === 'finished' && 'No Finished Matches Recorded'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
                {activeNavTab === 'live' && 'There are currently no active fixtures with clock countdown in progress. View upcoming fixtures or check completed results.'}
                {activeNavTab === 'upcoming' && 'There are no future fixtures scheduled on the calendar right now.'}
                {activeNavTab === 'finished' && 'Matches that conclude with Full Time status will be archived here.'}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {activeNavTab === 'live' && upcomingMatches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavTabChange('upcoming')}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    View Upcoming Matches ({upcomingMatches.length})
                  </button>
                )}
                {canManageMatches && onOpenAddMatch && (
                  <button
                    type="button"
                    onClick={onOpenAddMatch}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Match</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
