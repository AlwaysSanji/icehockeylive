import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  Trophy,
  RotateCcw,
  Edit3,
  X,
  Filter,
  Sparkles
} from 'lucide-react';
import { 
  getAllLeagueTeams, 
  getAllLeaguePlayers, 
  saveCustomTeam, 
  deleteCustomTeam, 
  addPlayerToTeam, 
  deletePlayerFromTeam,
  calculateLeagueStandings,
  saveStandingsOverride,
  resetStandingsOverrides
} from '../services/scoreboardService';
import { generateTeamCrestSvg } from '../constants/hockeyData';

export function LeagueManager({
  matches = [],
  isReadOnly = false,
  initialSubTab = 'standings',
  initialSearchQuery = ''
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'standings', 'teams', 'players'
  const [notification, setNotification] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Standings Override Modal State
  const [editingTeamStanding, setEditingTeamStanding] = useState(null);
  const [overrideW, setOverrideW] = useState(0);
  const [overrideL, setOverrideL] = useState(0);
  const [overrideOTL, setOverrideOTL] = useState(0);
  const [overrideGF, setOverrideGF] = useState(0);
  const [overrideGA, setOverrideGA] = useState(0);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // 1. TEAMS DATA
  const teams = useMemo(() => {
    // eslint-disable-next-line no-unused-expressions
    reloadKey;
    return getAllLeagueTeams();
  }, [reloadKey]);

  // 2. PLAYERS DATA
  const players = useMemo(() => {
    // eslint-disable-next-line no-unused-expressions
    reloadKey;
    return getAllLeaguePlayers();
  }, [reloadKey]);

  // 3. STANDINGS DATA
  const standings = useMemo(() => {
    // eslint-disable-next-line no-unused-expressions
    reloadKey;
    return calculateLeagueStandings(matches);
  }, [matches, reloadKey]);

  // Sub-tab 1: Standings Search
  const [standingsSearch, setStandingsSearch] = useState('');
  const filteredStandings = useMemo(() => {
    if (!standingsSearch.trim()) return standings;
    const q = standingsSearch.toLowerCase();
    return standings.filter(t => t.name.toLowerCase().includes(q) || t.shortCode.toLowerCase().includes(q) || t.city?.toLowerCase().includes(q));
  }, [standings, standingsSearch]);

  // Sub-tab 2: Teams State
  const [teamSearch, setTeamSearch] = useState(initialSearchQuery || '');
  const [teamName, setTeamName] = useState('');
  const [teamShortCode, setTeamShortCode] = useState('');
  const [teamCity, setTeamCity] = useState('');
  const [teamStadium, setTeamStadium] = useState('');
  const [teamColor, setTeamColor] = useState('#2563eb');
  const [crestMode, setCrestMode] = useState('auto');
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return teams;
    const q = teamSearch.toLowerCase();
    return teams.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.city?.toLowerCase().includes(q) ||
      t.shortCode?.toLowerCase().includes(q)
    );
  }, [teams, teamSearch]);

  // Sub-tab 3: Players State
  const [playerSearch, setPlayerSearch] = useState(initialSearchQuery || '');
  const [playerTeamFilter, setPlayerTeamFilter] = useState('all');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('all');

  const [playerName, setPlayerName] = useState('');
  const [playerTeamId, setPlayerTeamId] = useState(() => teams[0]?.id || 'blackhawks');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerPosition, setPlayerPosition] = useState('C');
  const [playerCaptain, setPlayerCaptain] = useState('');
  const [playerNationality, setPlayerNationality] = useState('CAN');

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchQuery = !playerSearch.trim() || 
        p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
        String(p.number) === playerSearch.trim();
      const matchTeam = playerTeamFilter === 'all' || p.teamId === playerTeamFilter;
      const matchPos = playerPositionFilter === 'all' || p.pos === playerPositionFilter;
      return matchQuery && matchTeam && matchPos;
    });
  }, [players, playerSearch, playerTeamFilter, playerPositionFilter]);

  // Add Custom Team Handler
  const handleAddTeam = (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showNotification('Please provide a team name');
      return;
    }

    const cleanName = teamName.trim();
    const finalCrest = crestMode === 'custom' && customLogoUrl.trim() 
      ? (customLogoUrl.trim().startsWith('<svg') 
          ? customLogoUrl.trim() 
          : `<img src="${customLogoUrl.trim()}" alt="${cleanName}" class="w-full h-full object-contain" />`)
      : generateTeamCrestSvg(cleanName, teamColor);

    const newTeam = saveCustomTeam({
      name: cleanName,
      shortCode: teamShortCode.trim().toUpperCase() || cleanName.slice(0, 3).toUpperCase(),
      city: teamCity.trim(),
      stadium: teamStadium.trim() || `${cleanName} Arena`,
      primaryColor: teamColor,
      crestSvg: finalCrest
    });

    if (newTeam) {
      showNotification(`Team "${cleanName}" added to league successfully!`);
      setTeamName('');
      setTeamShortCode('');
      setTeamCity('');
      setTeamStadium('');
      setCustomLogoUrl('');
      setReloadKey(k => k + 1);
    }
  };

  const handleDeleteTeam = (teamId, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from custom teams?`)) {
      deleteCustomTeam(teamId);
      showNotification(`Team "${name}" removed`);
      setReloadKey(k => k + 1);
    }
  };

  // Add Custom Player Handler
  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      showNotification('Please enter player name');
      return;
    }

    const added = addPlayerToTeam(playerTeamId, {
      name: playerName.trim(),
      number: playerNumber,
      pos: playerPosition,
      nationality: playerNationality,
      captain: playerCaptain
    });

    if (added) {
      const teamObj = teams.find(t => t.id === playerTeamId);
      showNotification(`Added ${added.name} (#${added.number}) to ${teamObj?.name || 'team'}!`);
      setPlayerName('');
      setPlayerNumber('');
      setPlayerCaptain('');
      setReloadKey(k => k + 1);
    }
  };

  const handleDeletePlayer = (teamId, playerId, name) => {
    if (window.confirm(`Delete player ${name} from team roster?`)) {
      deletePlayerFromTeam(teamId, playerId);
      showNotification(`Player ${name} removed`);
      setReloadKey(k => k + 1);
    }
  };

  // Open Standings Override Modal
  const openStandingsOverride = (team) => {
    setEditingTeamStanding(team);
    setOverrideW(team.w);
    setOverrideL(team.l);
    setOverrideOTL(team.otl);
    setOverrideGF(team.gf);
    setOverrideGA(team.ga);
  };

  const handleSaveOverride = (e) => {
    e.preventDefault();
    if (!editingTeamStanding) return;

    const w = Math.max(0, parseInt(overrideW, 10) || 0);
    const l = Math.max(0, parseInt(overrideL, 10) || 0);
    const otl = Math.max(0, parseInt(overrideOTL, 10) || 0);
    const gf = Math.max(0, parseInt(overrideGF, 10) || 0);
    const ga = Math.max(0, parseInt(overrideGA, 10) || 0);
    const gp = w + l + otl;
    const pts = (w * 2) + otl;

    saveStandingsOverride(editingTeamStanding.id, {
      w, l, otl, gf, ga, gp, pts
    });

    showNotification(`Standings updated for ${editingTeamStanding.name}!`);
    setEditingTeamStanding(null);
    setReloadKey(k => k + 1);
  };

  const handleResetOverrides = () => {
    if (window.confirm('Reset all manual standings overrides back to auto-calculated match scores?')) {
      resetStandingsOverrides();
      showNotification('Standings reset to auto-calculated values');
      setReloadKey(k => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Field / Sub-tab Switcher (Standings vs Teams vs Players) */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('standings')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'standings'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Standings</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
            activeSubTab === 'standings' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
          }`}>
            PTS Table
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('teams')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'teams'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Teams Field</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
            activeSubTab === 'teams' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {teams.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('players')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'players'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Players Field</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
            activeSubTab === 'players' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {players.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* FIELD 0: STANDINGS VIEW                                    */}
      {/* ========================================================= */}
      {activeSubTab === 'standings' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={standingsSearch}
                onChange={(e) => setStandingsSearch(e.target.value)}
                placeholder="Search standings by team name or code..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetOverrides}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset any manual adjustments back to auto-calculated match results"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Auto</span>
                </button>
              </div>
            )}
          </div>

          {/* Standings Table Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4 text-center w-12">#</th>
                    <th className="py-3 px-4 min-w-[180px]">Team</th>
                    <th className="py-3 px-2 text-center w-12" title="Games Played">GP</th>
                    <th className="py-3 px-2 text-center w-12" title="Wins (2 PTS)">W</th>
                    <th className="py-3 px-2 text-center w-12" title="Regulation Losses (0 PTS)">L</th>
                    <th className="py-3 px-2 text-center w-12" title="Overtime Losses (1 PT)">OTL</th>
                    <th className="py-3 px-3 text-center w-16 bg-blue-50/70 text-blue-900 font-black" title="Total Points">PTS</th>
                    <th className="py-3 px-2 text-center w-12" title="Goals For">GF</th>
                    <th className="py-3 px-2 text-center w-12" title="Goals Against">GA</th>
                    <th className="py-3 px-2 text-center w-12" title="Goal Differential">DIFF</th>
                    {!isReadOnly && <th className="py-3 px-3 text-right w-16">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filteredStandings.map((team, idx) => {
                    const isPlayoffSpot = idx < 8;

                    return (
                      <tr 
                        key={team.id}
                        className={`hover:bg-gray-50/60 transition-colors ${
                          team.isOverridden ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 sm:px-4 text-center font-bold text-gray-400">
                          <span className={`inline-block w-6 text-center ${
                            isPlayoffSpot ? 'font-black text-gray-900' : 'text-gray-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-gray-900 flex items-center gap-3">
                          <div 
                            className="w-6 h-6 shrink-0 flex items-center justify-center p-0.5 bg-gray-50 rounded-lg border border-gray-200"
                            dangerouslySetInnerHTML={{ __html: team.crestSvg }}
                          />
                          <div className="min-w-0">
                            <span className="truncate max-w-[160px] sm:max-w-[220px] block font-bold text-gray-900">
                              {team.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              {team.stadium || team.city}
                            </span>
                          </div>
                          {team.isOverridden && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded uppercase shrink-0">
                              Adjusted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600 font-medium">{team.gp}</td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-700">{team.w}</td>
                        <td className="py-3 px-2 text-center text-gray-500">{team.l}</td>
                        <td className="py-3 px-2 text-center text-amber-700">{team.otl}</td>
                        <td className="py-3 px-3 text-center text-base font-black text-blue-600 bg-blue-50/40">
                          {team.pts}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">{team.gf}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{team.ga}</td>
                        <td className={`py-3 px-2 text-center font-bold ${
                          team.diff > 0 ? 'text-emerald-600' : team.diff < 0 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {team.diff > 0 ? `+${team.diff}` : team.diff}
                        </td>
                        {!isReadOnly && (
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => openStandingsOverride(team)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-700 font-sans text-[11px] font-bold transition-colors cursor-pointer"
                              title="Edit team standings record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FIELD 1: TEAMS VIEW                                       */}
      {/* ========================================================= */}
      {activeSubTab === 'teams' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search teams by name or city..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="text-xs font-bold text-gray-400">
              Showing {filteredTeams.length} of {teams.length} Teams
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTeams.map((team) => (
              <div 
                key={team.id}
                className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs"
                    dangerouslySetInnerHTML={{ __html: team.crestSvg }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-gray-900 text-sm truncate">{team.name}</h4>
                      <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 text-[10px] font-mono font-bold rounded-md">
                        {team.shortCode || team.id.slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{team.stadium || 'Home Arena'}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{team.city || 'NHL League'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono text-[11px] font-semibold text-gray-600">
                    {team.playerCount} Players on Roster
                  </span>
                  {!isReadOnly && team.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="text-red-500 hover:text-red-700 text-[11px] font-bold p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                      title="Delete custom team"
                    >
                      Delete Team
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Team Form at Bottom (For Admin/Operators only) */}
          {!isReadOnly && (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-xs mt-6">
              <div className="pb-4 mb-5 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Add Custom Team to League</h3>
                <p className="text-xs text-gray-400">Created teams become available immediately in fixtures and rosters</p>
              </div>

              <form onSubmit={handleAddTeam} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Seattle Metropolitans"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">3-Letter Short Code</label>
                    <input
                      type="text"
                      value={teamShortCode}
                      onChange={(e) => setTeamShortCode(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="e.g. SEA"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      value={teamCity}
                      onChange={(e) => setTeamCity(e.target.value)}
                      placeholder="e.g. Seattle, WA"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Home Stadium / Arena</label>
                    <input
                      type="text"
                      value={teamStadium}
                      onChange={(e) => setTeamStadium(e.target.value)}
                      placeholder="e.g. Climate Pledge Arena"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={teamColor}
                        onChange={(e) => setTeamColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={teamColor}
                        onChange={(e) => setTeamColor(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Logo URL (Optional SVG or Image)</label>
                    <input
                      type="text"
                      value={customLogoUrl}
                      onChange={(e) => {
                        setCustomLogoUrl(e.target.value);
                        if (e.target.value.trim()) setCrestMode('custom');
                        else setCrestMode('auto');
                      }}
                      placeholder="https://... or raw <svg>...</svg>"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    + Add Custom Team
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* FIELD 2: PLAYERS VIEW                                     */}
      {/* ========================================================= */}
      {activeSubTab === 'players' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Search player name or jersey #..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {/* Team dropdown */}
              <select
                value={playerTeamFilter}
                onChange={(e) => setPlayerTeamFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Teams ({teams.length})</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              {/* Position Filter */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                {['all', 'C', 'LW', 'RW', 'D', 'G'].map(pos => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPlayerPositionFilter(pos)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      playerPositionFilter === pos ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    {pos === 'all' ? 'All' : pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredPlayers.map((player, idx) => (
              <div 
                key={`${player.teamId}-${player.number}-${idx}`}
                className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gray-950 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                    #{player.number}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-gray-900 text-xs truncate">{player.name}</span>
                      {player.captain && (
                        <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded">
                          {player.captain}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-gray-600">{player.teamName}</span>
                      <span>•</span>
                      <span className="font-bold text-blue-600">{player.pos}</span>
                      <span>•</span>
                      <span>{player.nationality || 'CAN'}</span>
                    </div>
                  </div>
                </div>

                {!isReadOnly && player.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeletePlayer(player.teamId, player.id || player.number, player.name)}
                    className="text-red-500 hover:text-red-700 text-xs p-1 rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                    title="Remove player from roster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Custom Player Form at Bottom (For Admin/Operators only) */}
          {!isReadOnly && (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-xs mt-6">
              <div className="pb-4 mb-5 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Add Custom Player to Roster</h3>
                <p className="text-xs text-gray-400">Newly added players appear in match lineups and scoring selectors</p>
              </div>

              <form onSubmit={handleAddPlayer} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Player Full Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="e.g. Connor Bedard"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Team Assignment</label>
                    <select
                      value={playerTeamId}
                      onChange={(e) => setPlayerTeamId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Jersey Number</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={playerNumber}
                      onChange={(e) => setPlayerNumber(e.target.value)}
                      placeholder="e.g. 98"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Position</label>
                    <select
                      value={playerPosition}
                      onChange={(e) => setPlayerPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="C">Center (C)</option>
                      <option value="LW">Left Wing (LW)</option>
                      <option value="RW">Right Wing (RW)</option>
                      <option value="D">Defenseman (D)</option>
                      <option value="G">Goaltender (G)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Captaincy</label>
                    <select
                      value={playerCaptain}
                      onChange={(e) => setPlayerCaptain(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value="">None</option>
                      <option value="A">Alternate Captain (A)</option>
                      <option value="C">Captain (C)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={playerNationality}
                      onChange={(e) => setPlayerNationality(e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="e.g. CAN / USA / SWE"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    + Add Player to Roster
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Standings Override Edit Modal (Admin Only) */}
      {editingTeamStanding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Override Standings: {editingTeamStanding.name}
                </h3>
                <p className="text-xs text-gray-400">Manually adjust team records for the league table</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeamStanding(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Wins (W)</label>
                  <input
                    type="number"
                    min="0"
                    value={overrideW}
                    onChange={(e) => setOverrideW(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Losses (L)</label>
                  <input
                    type="number"
                    min="0"
                    value={overrideL}
                    onChange={(e) => setOverrideL(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">OT Losses (OTL)</label>
                  <input
                    type="number"
                    min="0"
                    value={overrideOTL}
                    onChange={(e) => setOverrideOTL(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Goals For (GF)</label>
                  <input
                    type="number"
                    min="0"
                    value={overrideGF}
                    onChange={(e) => setOverrideGF(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Goals Against (GA)</label>
                  <input
                    type="number"
                    min="0"
                    value={overrideGA}
                    onChange={(e) => setOverrideGA(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl text-xs flex justify-between items-center text-blue-900">
                <span className="font-semibold">Calculated Total Points:</span>
                <span className="font-black font-mono text-sm">
                  {(parseInt(overrideW, 10) || 0) * 2 + (parseInt(overrideOTL, 10) || 0)} PTS
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeamStanding(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
