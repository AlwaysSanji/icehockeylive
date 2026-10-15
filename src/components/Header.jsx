import React from 'react';
import { Maximize2 } from 'lucide-react';

export function Header({ 
  currentView, 
  setView, 
  currentUser, 
  canAccessRemote = false,
  onLogout,
  onOpenLogin
}) {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  const isLoggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || currentUser?.email?.includes('admin');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand / Title */}
        <div 
          onClick={() => setView('list')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="text-xl">🏒</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-900 tracking-tight text-lg">
                Ice Hockey Live
              </span>
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                NHL
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium hidden sm:block">
              {isLoggedIn ? `Logged in as ${currentUser.name}` : 'Official NHL Live Scoreboard & Fixtures'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* If Logged in: show switcher & logout */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {canAccessRemote && (
                <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
                  <button
                    onClick={() => setView('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentView === 'list' || currentView === 'detail'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Scoreboard
                  </button>
                  <button
                    onClick={() => setView('remote')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentView === 'remote'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Remote Control</span>
                  </button>
                </div>
              )}

              {/* User greeting */}
              <div className="hidden lg:flex items-center px-2.5 py-1 text-xs text-gray-600 font-medium bg-gray-50 rounded-lg border border-gray-100">
                <span className="truncate max-w-[120px]">{currentUser.name}</span>
                {isAdmin ? (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase rounded-md">
                    Admin
                  </span>
                ) : canAccessRemote ? (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase rounded-md">
                    Operator
                  </span>
                ) : (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded-md border border-gray-200">
                    Spectator
                  </span>
                )}
              </div>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                title="Log out"
              >
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            /* Public View: Square Login Button with Hover Effect */
            <button
              onClick={onOpenLogin}
              className="group px-4 py-2 bg-white hover:bg-blue-600 text-gray-700 hover:text-white text-xs font-semibold rounded-none border border-gray-300 hover:border-blue-600 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              title="Sign in or Create an account"
            >
              <span>Login</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex"
            title="Toggle Stadium Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
