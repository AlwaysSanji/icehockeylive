import React from 'react';
import { 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  Search, 
  Plus, 
  Trash2, 
  Sliders, 
  Monitor, 
  LogOut, 
  LogIn,
  Radio
} from 'lucide-react';

export function UnifiedNavbar({
  activeNavTab,          // 'league', 'live', 'upcoming', 'finished'
  onNavTabChange,
  liveCount = 0,
  upcomingCount = 0,
  finishedCount = 0,
  currentView,            // 'list', 'detail', 'remote'
  onViewChange,
  canManageMatches = false, // true if admin or operator
  onOpenAddMatch,
  onOpenDeleteMatch,
  onOpenSearch,
  currentUser,
  onLogout,
  onOpenLogin
}) {
  const isLoggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || currentUser?.email?.includes('admin');
  const isOperator = currentUser?.role === 'operator' || currentUser?.canControlRemote;

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

      {/* Right: Actions, Search, View Switcher & Auth */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between md:justify-end">
        {/* Global Instant Search Button */}
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

        {/* Admin/Operator Match Actions */}
        {canManageMatches && onOpenAddMatch && (
          <button
            type="button"
            onClick={onOpenAddMatch}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
            title="Create new match fixture"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Match</span>
          </button>
        )}

        {canManageMatches && onOpenDeleteMatch && (
          <button
            type="button"
            onClick={onOpenDeleteMatch}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 hover:border-red-200 text-xs font-bold transition-colors cursor-pointer"
            title="Delete a match fixture"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}

        {/* View Switcher: Scoreboard ⇄ Remote Control */}
        {canManageMatches && onViewChange && (
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => onViewChange('list')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                currentView === 'list' || currentView === 'detail'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Public Scoreboard view"
            >
              <Monitor className="w-3 h-3" />
              <span className="hidden sm:inline">Scoreboard</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('remote')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                currentView === 'remote'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Operator Remote Control view"
            >
              <Sliders className="w-3 h-3" />
              <span>Remote</span>
            </button>
          </div>
        )}

        {/* Profile / Auth */}
        {isLoggedIn ? (
          <div className="flex items-center gap-1.5">
            <span className="hidden xl:inline text-xs font-semibold text-gray-600">
              {currentUser.name}
            </span>
            {isAdmin ? (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase rounded-md">
                Admin
              </span>
            ) : isOperator ? (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase rounded-md">
                Op
              </span>
            ) : null}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-gray-500 hover:text-red-600 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : onOpenLogin ? (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}
