import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScoreboardList } from './components/ScoreboardList';
import { MatchDetailView } from './components/MatchDetailView';
import { RemoteView } from './components/RemoteView';
import { AuthView } from './components/AuthView';
import { LegalModal } from './components/LegalModal';
import { TeamEditorModal } from './components/TeamEditorModal';
import { FirebaseModal } from './components/FirebaseModal';
import { SearchModal } from './components/SearchModal';
import { isFirebaseConfigured, activeConfig } from './firebase/config';
import { useScoreboard } from './hooks/useScoreboard';
import { getCurrentUser, logoutUser, checkSession, canUserAccessRemote, isUserAdmin } from './services/authService';

export default function App() {
  const scoreboard = useScoreboard();
  const { matchState } = scoreboard;

  // Authentication state (current logged-in user or null)
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const isLoggedIn = Boolean(currentUser);
  const canAccessRemote = canUserAccessRemote(currentUser);
  const [legalModalTab, setLegalModalTab] = useState(null); // 'privacy', 'tos', or null

  // Top navbar tab state ('live', 'league', 'upcoming', 'finished')
  const [activeNavTab, setActiveNavTab] = useState('live');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // View routing: 'list', 'detail', 'remote', or 'login'
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash;
    const authedUser = getCurrentUser();
    if (hash === '#login' || hash === '#register') {
      return authedUser ? 'list' : 'login';
    }
    if (hash === '#remote') {
      return authedUser ? 'remote' : 'login';
    }
    if (hash === '#detail') return 'detail';
    return 'list';
  });

  const [selectedMatchId, setSelectedMatchId] = useState('live-match-1');
  const [isTeamEditorOpen, setIsTeamEditorOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K opens instant search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync route with window hash for easy navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const authedUser = getCurrentUser();
      if (hash === '#login' || hash === '#register') {
        setCurrentView(authedUser ? 'list' : 'login');
      } else if (hash === '#remote') {
        setCurrentView(authedUser ? 'remote' : 'login');
      } else if (hash === '#detail') {
        setCurrentView('detail');
      } else {
        setCurrentView('list');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeView = (newView) => {
    setCurrentView(newView);
    window.location.hash = newView;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMatch = (matchId) => {
    scoreboard.selectMatch(matchId);
    setSelectedMatchId(matchId);
    changeView('detail');
  };

  // Verify backend session on mount (cookies / session)
  useEffect(() => {
    checkSession().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Login / Register Success Handler - Route to live scoreboard
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    changeView('list');
  };

  // Logout Handler
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    changeView('list');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between">
      <div>
        {/* Navigation Header */}
        <Header
          currentView={currentView}
          setView={changeView}
          currentUser={currentUser}
          canAccessRemote={canAccessRemote}
          onLogout={handleLogout}
          onOpenLogin={() => changeView('login')}
        />

        {/* Main View Area */}
        <main>
          {currentView === 'list' && (
            <ScoreboardList
              liveMatchState={matchState}
              matches={scoreboard.matches}
              onSelectMatch={handleSelectMatch}
              activeNavTab={activeNavTab}
              onNavTabChange={setActiveNavTab}
              canManageMatches={canAccessRemote}
              onOpenAddMatch={() => {
                if (canAccessRemote) {
                  changeView('remote');
                } else {
                  changeView('login');
                }
              }}
              onOpenDeleteMatch={() => {
                if (canAccessRemote) {
                  changeView('remote');
                } else {
                  changeView('login');
                }
              }}
              onOpenSearch={() => setIsSearchOpen(true)}
              currentUser={currentUser}
              currentView={currentView}
              onViewChange={changeView}
              onLogout={handleLogout}
              onOpenLogin={() => changeView('login')}
            />
          )}

          {currentView === 'detail' && (
            <MatchDetailView
              matchState={scoreboard.matches?.find(m => m.id === selectedMatchId) || matchState}
              isLoggedIn={isLoggedIn}
              canAccessRemote={canAccessRemote}
              onBackToList={() => changeView('list')}
              onOpenRemote={() => {
                const targetId = selectedMatchId || matchState.id;
                scoreboard.selectMatch(targetId);
                changeView('remote');
              }}
              onOpenLogin={() => changeView('login')}
            />
          )}

          {currentView === 'login' && (
            <AuthView
              onAuthSuccess={handleAuthSuccess}
              onBackToPublic={() => changeView('list')}
              initialMode={window.location.hash === '#register' ? 'register' : 'login'}
            />
          )}

          {currentView === 'remote' && (
            isLoggedIn ? (
              <RemoteView
                matchState={matchState}
                matches={scoreboard.matches}
                scoreboard={scoreboard}
                currentUser={currentUser}
                canAccessRemote={canAccessRemote}
                onSelectMatch={scoreboard.selectMatch}
                onAddMatch={scoreboard.addMatch}
                onDeleteMatch={scoreboard.deleteMatch}
                onBackToScoreboard={() => changeView('list')}
                onOpenTeamEditor={() => setIsTeamEditorOpen(true)}
                onLogout={handleLogout}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            ) : (
              <AuthView
                onAuthSuccess={handleAuthSuccess}
                onBackToPublic={() => changeView('list')}
                initialMode="login"
              />
            )
          )}
        </main>
      </div>

      {/* Modals */}
      {isTeamEditorOpen && (
        <TeamEditorModal
          matchState={matchState}
          onSave={scoreboard.updateTeamDetails}
          onClose={() => setIsTeamEditorOpen(false)}
        />
      )}
      {/* Legal & Configuration Modals */}
      {legalModalTab && (
        <LegalModal
          initialTab={legalModalTab}
          onClose={() => setLegalModalTab(null)}
        />
      )}

      {isFirebaseModalOpen && (
        <FirebaseModal
          onClose={() => setIsFirebaseModalOpen(false)}
        />
      )}

      {/* Unified Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        matches={scoreboard.matches}
        onSelectMatch={(matchId) => {
          handleSelectMatch(matchId);
          setIsSearchOpen(false);
        }}
        onNavigateToLeague={(subTab) => {
          setActiveNavTab('league');
          changeView('list');
          setIsSearchOpen(false);
        }}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-gray-200/60 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <span>🏒 NHL Ice Hockey</span>
            <span className="text-gray-300">•</span>
            <span>Real-Time Arena Scoreboard</span>
          </div>

          {/* Privacy & Terms of Service Links */}
          <div className="flex items-center gap-3 text-gray-400 font-medium">
            <button
              onClick={() => setLegalModalTab('privacy')}
              className="hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
            >
              Privacy Policy
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => setLegalModalTab('tos')}
              className="hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
            >
              Terms of Service
            </button>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Firebase Firestore Cloud Real-Time Sync"
            >
              <span>Firebase Cloud: {activeConfig?.projectId || 'icehockeylive-01'}</span>
            </button>
            <span className="text-gray-300">•</span>
            {isLoggedIn ? (
              <span className="text-gray-600 font-medium">
                Signed in as <strong className="text-gray-800">{currentUser.name}</strong>
              </span>
            ) : (
              <button 
                onClick={() => changeView('login')}
                className="hover:text-blue-600 transition-colors"
              >
                Sign in / Create Account
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
