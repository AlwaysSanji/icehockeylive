import React from 'react';
import { 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  Search 
} from 'lucide-react';

export function UnifiedNavbar({
  activeNavTab,          // 'league', 'live', 'upcoming', 'finished'
  onNavTabChange,
  liveCount = 0,
  upcomingCount = 0,
  finishedCount = 0,
  onOpenSearch
}) {
  return (
    <nav className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-200/90 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => onNavTabChange('league')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeNavTab === 'league'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-700 hover:text-gray-950 hover:bg-white/60'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>League</span>
        </button>

        <button
          type="button"
          onClick={() => onNavTabChange('live')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeNavTab === 'live'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-gray-700 hover:text-red-700 hover:bg-white/60'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeNavTab === 'live' ? 'bg-white' : 'bg-red-500'} animate-pulse`} />
          <span>Live</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
            activeNavTab === 'live' ? 'bg-white/20 text-white font-black' : 'bg-gray-200 text-gray-700 font-bold'
          }`}>
            {liveCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavTabChange('upcoming')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeNavTab === 'upcoming'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-700 hover:text-amber-700 hover:bg-white/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
            activeNavTab === 'upcoming' ? 'bg-white/20 text-white font-black' : 'bg-gray-200 text-gray-700 font-bold'
          }`}>
            {upcomingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavTabChange('finished')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeNavTab === 'finished'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-700 hover:text-emerald-700 hover:bg-white/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Finished</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
            activeNavTab === 'finished' ? 'bg-white/20 text-white font-black' : 'bg-gray-200 text-gray-700 font-bold'
          }`}>
            {finishedCount}
          </span>
        </button>
      </div>

      {/* Right: Instant Search */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition-colors cursor-pointer"
          title="Instant search across matches, teams, and players (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden lg:inline text-[9px] bg-white border border-gray-200 rounded px-1 text-gray-400">⌘K</kbd>
        </button>
      </div>
    </nav>
  );
}
