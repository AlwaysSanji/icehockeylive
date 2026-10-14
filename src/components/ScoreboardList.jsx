import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react';
import { NHL_LEAGUE_CARDS_TODAY, NHL_LEAGUE_CARDS_TOMORROW, NHL_TEAMS } from '../constants/hockeyData';
import { useGameClock } from '../hooks/useGameClock';

export function ScoreboardList({ liveMatchState, matches = [], onSelectMatch }) {
  const [selectedDate, setSelectedDate] = useState('Today'); // 'Today' or 'Tomorrow'
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Live', 'Finished', 'Upcoming'
  const [searchQuery, setSearchQuery] = useState('');

  // Clock for the live match row
  const { formattedTime, isRunning } = useGameClock(liveMatchState.clock);

  // Status text for live match
  const liveStatusText = useMemo(() => {
    const period = String(liveMatchState.period).toUpperCase();
    if (period === 'FT') return 'FT';
    if (isRunning) {
      return `LIVE ${formattedTime}`;
    }
    return `P${period} ${formattedTime}`;
  }, [liveMatchState.period, isRunning, formattedTime]);

  // Handle date switching
  const handlePreviousDate = () => {
    if (selectedDate === 'Tomorrow') {
      setSelectedDate('Today');
    }
  };

  const handleNextDate = () => {
    if (selectedDate === 'Today') {
      setSelectedDate('Tomorrow');
    }
  };

  // Build unified fixture objects from dynamic matches
  const allMatchFixtures = useMemo(() => {
    const list = matches && matches.length > 0 ? matches : [liveMatchState];

    return list.map(m => {
      // If this match is currently active, merge real-time live clock and scores
      const isCurrentActive = liveMatchState && m.id === liveMatchState.id;
      const target = isCurrentActive ? { ...m, ...liveMatchState } : m;

      const homeId = target.home?.id || 'blackhawks';
      const awayId = target.away?.id || 'penguins';

      const homeTeam = {
        name: target.home?.name || 'Home Team',
        crestSvg: NHL_TEAMS[homeId]?.crestSvg || target.home?.crestSvg || `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="46" fill="#1e40af"/><text x="50" y="58" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">H</text></svg>`
      };

      const awayTeam = {
        name: target.away?.name || 'Away Team',
        crestSvg: NHL_TEAMS[awayId]?.crestSvg || target.away?.crestSvg || `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="46" fill="#ca8a04"/><text x="50" y="58" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">A</text></svg>`
      };

      const isFinished = target.period === 'FT' || target.status === 'Finished';
      const isUpcoming = target.period === 'UPCOMING' || target.status === 'Upcoming';
      const isLive = !isFinished && !isUpcoming;

      let badge = target.statusBadge || 'FT';
      if (isFinished) {
        badge = 'FT';
      } else if (isUpcoming) {
        badge = target.statusBadge || '19:00';
      } else if (isCurrentActive && isRunning) {
        badge = liveStatusText;
      } else {
        badge = `P${target.period || '1'}`;
      }

      const dateStr = target.date || target.dateTime || 'Wed, Oct 14, 2026';
      const isTomorrow = dateStr.includes('Oct 15') || dateStr.toLowerCase().includes('tomorrow') || dateStr.toLowerCase().includes('thu');

      return {
        id: target.id,
        homeTeam,
        awayTeam,
        homeScore: isUpcoming ? '-' : (target.home?.score ?? 0),
        awayScore: isUpcoming ? '-' : (target.away?.score ?? 0),
        venue: target.venue || 'United Center',
        date: target.dateTime || target.date || 'Wed, Oct 14, 2026',
        statusBadge: badge,
        status: isFinished ? 'Finished' : (isUpcoming ? 'Upcoming' : 'Live'),
        isLive,
        isTomorrow,
        isLiveSync: true
      };
    });
  }, [matches, liveMatchState, isRunning, liveStatusText]);

  // Base fixtures depending on selected date
  const activeCards = useMemo(() => {
    const isTomorrowView = selectedDate === 'Tomorrow';
    const fixturesForDate = allMatchFixtures.filter(f => isTomorrowView ? f.isTomorrow : !f.isTomorrow);

    if (fixturesForDate.length === 0) return [];

    return [
      {
        country: 'USA',
        league: 'NHL',
        fixtures: fixturesForDate
      }
    ];
  }, [selectedDate, allMatchFixtures]);

  // Filter cards by tab and search query
  const filteredCards = useMemo(() => {
    return activeCards.map(card => {
      const filteredFixtures = card.fixtures.filter(fixture => {
        // Tab filtering only applies when on Today
        if (selectedDate === 'Today') {
          if (activeFilter === 'Live' && !fixture.isLive) return false;
          if (activeFilter === 'Finished' && fixture.status !== 'Finished' && fixture.statusBadge !== 'FT') return false;
          if (activeFilter === 'Upcoming' && fixture.status !== 'Upcoming' && fixture.statusBadge !== 'SCHED') return false;
        }

        // Search filtering
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const home = (fixture.homeTeam?.name || '').toLowerCase();
          const away = (fixture.awayTeam?.name || '').toLowerCase();
          return home.includes(q) || away.includes(q);
        }
        return true;
      });

      return {
        ...card,
        fixtures: filteredFixtures
      };
    }).filter(card => card.fixtures.length > 0);
  }, [activeCards, selectedDate, activeFilter, searchQuery]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 1. Header Navigation Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 mb-6">
        {/* Date Selector */}
        <div className="flex items-center justify-between mb-5">
          <button 
            onClick={handlePreviousDate}
            disabled={selectedDate === 'Today'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              selectedDate === 'Today'
                ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-gray-800 font-semibold text-base sm:text-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span>{selectedDate}</span>
          </div>

          <button 
            onClick={handleNextDate}
            disabled={selectedDate === 'Tomorrow'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              selectedDate === 'Tomorrow'
                ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 
          Filter Options (All, Live, Finished, Upcoming) 
          Shown only when selectedDate === 'Today'. 
          Hidden when selectedDate === 'Tomorrow'.
        */}
        {selectedDate === 'Today' && (
          <div className="flex items-center gap-6 border-b border-gray-100 pb-2 mb-5 overflow-x-auto text-sm font-semibold">
            <button
              onClick={() => setActiveFilter('All')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeFilter === 'All'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span>All</span>
            </button>

            <button
              onClick={() => setActiveFilter('Live')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeFilter === 'Live'
                  ? 'text-emerald-600 border-b-2 border-emerald-600 font-bold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span>Live</span>
            </button>

            <button
              onClick={() => setActiveFilter('Finished')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeFilter === 'Finished'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span>Finished</span>
            </button>

            <button
              onClick={() => setActiveFilter('Upcoming')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeFilter === 'Upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span>Upcoming</span>
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams, leagues..."
            className="w-full bg-[#ECEEF2] hover:bg-gray-200/80 focus:bg-white text-gray-800 placeholder-gray-500 text-sm pl-11 pr-4 py-3 rounded-2xl outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 2. League Fixture Cards */}
      <div className="space-y-6">
        {filteredCards.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-gray-400 text-sm shadow-xs border border-gray-100">
            No matches found for {selectedDate}.
          </div>
        ) : (
          filteredCards.map((card, cardIndex) => (
            <div 
              key={cardIndex}
              className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100"
            >
              {/* League Header with USA Flag */}
              <div className="flex items-center gap-3 pb-4 mb-3 border-b border-gray-100">
                <div className="w-6 h-4 rounded-xs overflow-hidden flex flex-col shadow-xs border border-gray-200 shrink-0">
                  <div className="h-1/2 bg-[#002868] flex items-center justify-center">
                    <span className="text-[6px] text-white">★</span>
                  </div>
                  <div className="h-1/2 flex flex-col">
                    <div className="h-1/3 bg-[#BF0A30]"></div>
                    <div className="h-1/3 bg-white"></div>
                    <div className="h-1/3 bg-[#BF0A30]"></div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase leading-none">
                    {card.country}
                  </div>
                  <div className="text-sm font-bold text-gray-800 leading-tight">
                    {card.league}
                  </div>
                </div>
              </div>

              {/* Match Rows */}
              <div className="divide-y divide-gray-100">
                {card.fixtures.map((fixture) => (
                  <div
                    key={fixture.id}
                    onClick={() => onSelectMatch(fixture.id)}
                    className="py-4 px-3 sm:px-4 rounded-2xl transition-colors flex items-center justify-between hover:bg-gray-50/80 cursor-pointer group"
                  >
                    {/* Status Text (Clean text) */}
                    <div className="w-16 sm:w-20 shrink-0">
                      <span
                        className={`text-xs font-bold tracking-wide ${
                          fixture.isLive
                            ? 'text-emerald-600 font-mono animate-pulse'
                            : fixture.status === 'Upcoming'
                              ? 'text-blue-600 font-mono'
                              : 'text-gray-400'
                        }`}
                      >
                        {fixture.statusBadge}
                      </span>
                    </div>

                    {/* Match Teams & Score (Centered Layout) */}
                    <div className="flex-1 flex items-center justify-center gap-2 sm:gap-6 min-w-0 px-2">
                      {/* Home Team */}
                      <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 text-right min-w-0">
                        <span className={`font-semibold text-gray-800 text-sm sm:text-base truncate transition-colors ${
                          fixture.isLiveSync ? 'group-hover:text-blue-600' : ''
                        }`}>
                          {fixture.homeTeam?.name}
                        </span>
                        <div 
                          className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: fixture.homeTeam?.crestSvg }}
                        />
                      </div>

                      {/* Score */}
                      <div className="w-16 sm:w-20 text-center shrink-0">
                        <span className="text-base sm:text-lg font-bold text-gray-900 tracking-wider">
                          {fixture.homeScore} &nbsp;-&nbsp; {fixture.awayScore}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex items-center justify-start gap-2 sm:gap-3 text-left min-w-0">
                        <div 
                          className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: fixture.awayTeam?.crestSvg }}
                        />
                        <span className={`font-semibold text-gray-800 text-sm sm:text-base truncate transition-colors ${
                          fixture.isLiveSync ? 'group-hover:text-blue-600' : ''
                        }`}>
                          {fixture.awayTeam?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
