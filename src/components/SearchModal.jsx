import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Trophy, Users, Shield, Calendar, Radio, CheckCircle2, ArrowRight } from 'lucide-react';
import { getAllLeagueTeams, getAllLeaguePlayers } from '../services/scoreboardService';

export function SearchModal({
  isOpen,
  onClose,
  matches = [],
  onSelectMatch,
  onNavigateToLeague
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Read teams and players
  const allTeams = useMemo(() => {
    if (!isOpen) return [];
    return getAllLeagueTeams();
  }, [isOpen]);

  const allPlayers = useMemo(() => {
    if (!isOpen) return [];
    return getAllLeaguePlayers();
  }, [isOpen]);

  const trimmedQuery = query.trim().toLowerCase();

  // 1. Matches results
  const matchedMatches = useMemo(() => {
    if (!trimmedQuery) return matches.slice(0, 4);
    return matches.filter(m => {
      const home = m.home?.name?.toLowerCase() || '';
      const away = m.away?.name?.toLowerCase() || '';
      const venue = m.venue?.toLowerCase() || '';
      const period = String(m.period || '').toLowerCase();
      const status = String(m.status || '').toLowerCase();
      return home.includes(trimmedQuery) || away.includes(trimmedQuery) || venue.includes(trimmedQuery) || period.includes(trimmedQuery) || status.includes(trimmedQuery);
    }).slice(0, 5);
  }, [matches, trimmedQuery]);

  // 2. Teams results
  const matchedTeams = useMemo(() => {
    if (!trimmedQuery) return allTeams.slice(0, 4);
    return allTeams.filter(t => {
      const name = t.name?.toLowerCase() || '';
      const city = t.city?.toLowerCase() || '';
      const code = t.shortCode?.toLowerCase() || '';
      const stadium = t.stadium?.toLowerCase() || '';
      return name.includes(trimmedQuery) || city.includes(trimmedQuery) || code.includes(trimmedQuery) || stadium.includes(trimmedQuery);
    }).slice(0, 5);
  }, [allTeams, trimmedQuery]);

  // 3. Players results
  const matchedPlayers = useMemo(() => {
    if (!trimmedQuery) return allPlayers.slice(0, 4);
    return allPlayers.filter(p => {
      const name = p.name?.toLowerCase() || '';
      const team = p.teamName?.toLowerCase() || '';
      const pos = p.pos?.toLowerCase() || '';
      const num = String(p.number || '');
      return name.includes(trimmedQuery) || team.includes(trimmedQuery) || pos.includes(trimmedQuery) || num === trimmedQuery;
    }).slice(0, 6);
  }, [allPlayers, trimmedQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fixtures, teams, players, arenas..."
            className="w-full text-base sm:text-lg font-semibold text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[11px] font-mono text-gray-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 divide-y divide-gray-100 flex-1">
          {/* Section 1: Matches */}
          {matchedMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Matches ({matchedMatches.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchedMatches.map((m) => {
                  const isLive = m.period !== 'FT' && m.period !== 'UPCOMING';
                  const isFinished = m.period === 'FT' || m.status === 'Finished';
                  const isUpcoming = m.period === 'UPCOMING';

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        onSelectMatch(m.id);
                        onClose();
                      }}
                      className="p-3 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isLive ? 'bg-red-500 animate-pulse' : isFinished ? 'bg-emerald-500' : 'bg-amber-400'
                        }`} />
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                            {m.home?.name || 'Home'} 
                            {!isUpcoming && <span className="font-black text-gray-800"> ({m.home?.score ?? 0} - {m.away?.score ?? 0}) </span>}
                            {isUpcoming && <span className="text-gray-400 font-medium"> vs </span>}
                            {m.away?.name || 'Away'}
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                            <span>{m.venue || 'Arena'}</span>
                            <span>•</span>
                            <span className="font-semibold text-gray-600">
                              {isFinished ? 'Final (FT)' : isUpcoming ? (m.dateTime || m.date || 'Scheduled') : `Live Period ${m.period || '1'}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Teams */}
          {matchedTeams.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Teams ({matchedTeams.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      if (onNavigateToLeague) onNavigateToLeague('teams', team.id);
                      onClose();
                    }}
                    className="p-3 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <div 
                      className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 p-1 flex items-center justify-center shrink-0"
                      dangerouslySetInnerHTML={{ __html: team.crestSvg }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 text-xs truncate">
                        {team.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {team.stadium || team.city || 'Team'}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 font-mono text-[10px] font-bold rounded-md">
                      {team.shortCode || team.id.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Players */}
          {matchedPlayers.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>Players ({matchedPlayers.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedPlayers.map((player, idx) => (
                  <div
                    key={`${player.teamId}-${player.number}-${idx}`}
                    onClick={() => {
                      if (onNavigateToLeague) onNavigateToLeague('players', player.name);
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gray-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        #{player.number}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-xs truncate">
                          {player.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {player.teamName} • <span className="font-bold text-blue-600">{player.pos}</span>
                        </div>
                      </div>
                    </div>
                    {player.captain && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md">
                        {player.captain}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedMatches.length === 0 && matchedTeams.length === 0 && matchedPlayers.length === 0 && (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-bold text-gray-700">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try searching by team name, player surname, position, or arena.</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 px-4">
          <span>Click any item to view details</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-gray-700 hover:text-gray-950 cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
