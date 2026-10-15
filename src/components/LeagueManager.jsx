import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  UserPlus, 
  ShieldAlert, 
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react';
import { 
  getAllLeagueTeams, 
  getAllLeaguePlayers, 
  saveCustomTeam, 
  deleteCustomTeam, 
  addPlayerToTeam, 
  deletePlayerFromTeam 
} from '../services/scoreboardService';
import { generateTeamCrestSvg } from '../constants/hockeyData';

export function LeagueManager() {
  const [activeSubTab, setActiveSubTab] = useState('teams'); // 'teams' or 'players'
  const [notification, setNotification] = useState('');

  // Reload trigger to re-render lists on mutation
  const [reloadKey, setReloadKey] = useState(0);

  const teams = useMemo(() => {
    // eslint-disable-next-line no-unused-expressions
    reloadKey;
    return getAllLeagueTeams();
  }, [reloadKey]);

  const players = useMemo(() => {
    // eslint-disable-next-line no-unused-expressions
    reloadKey;
    return getAllLeaguePlayers();
  }, [reloadKey]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // --- 1. TEAMS SUB-TAB STATE ---
  const [teamSearch, setTeamSearch] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamShortCode, setTeamShortCode] = useState('');
  const [teamCity, setTeamCity] = useState('');
  const [teamStadium, setTeamStadium] = useState('');
  const [teamColor, setTeamColor] = useState('#2563eb');
  const [crestMode, setCrestMode] = useState('auto'); // 'auto' or 'custom'
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

  const previewCrest = useMemo(() => {
    if (crestMode === 'custom' && customLogoUrl.trim()) {
      if (customLogoUrl.trim().startsWith('<svg')) {
        return customLogoUrl.trim();
      }
      return `<img src="${customLogoUrl.trim()}" alt="Logo" class="w-full h-full object-contain" />`;
    }
    return generateTeamCrestSvg(teamName || 'Custom Team', teamColor);
  }, [crestMode, customLogoUrl, teamName, teamColor]);

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

  // --- 2. PLAYERS SUB-TAB STATE ---
  const [playerSearch, setPlayerSearch] = useState('');
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Field / Sub-tab Switcher (Teams vs Players) */}
      <div className="flex items-center gap-3 p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('teams')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'teams'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Teams Field</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
            activeSubTab === 'teams' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {teams.length} Teams
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('players')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'players'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Players Field</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
            activeSubTab === 'players' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {players.length} Players
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* FIELD 1: TEAMS VIEW                                       */}
      {/* ========================================================= */}
      {activeSubTab === 'teams' && (
        <div className="space-y-6">
          {/* Top Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search teams by name or city..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold w-full sm:w-auto justify-between sm:justify-end">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                {teams.filter(t => !t.isCustom).length} Official NHL
              </span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                {teams.filter(t => t.isCustom).length} Custom Teams
              </span>
            </div>
          </div>

          {/* Teams Directory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => {
              const rosterSize = team.lineup?.length || 0;

              return (
                <div 
                  key={team.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:border-gray-300 hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-12 h-12 shrink-0 drop-shadow-xs flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: team.crestSvg }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-gray-900 truncate">
                          {team.name}
                        </h4>
                        <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md font-mono shrink-0">
                          {team.shortCode || team.name.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {team.stadium || team.city || 'Arena Stadium'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                          team.isCustom 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {team.isCustom ? 'Custom' : 'Official NHL'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium font-mono">
                          {rosterSize} Players
                        </span>
                      </div>
                    </div>
                  </div>

                  {team.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Delete custom team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* AT BOTTOM: ADD CUSTOM TEAM FORM                           */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Add Custom Team to League</h3>
                <p className="text-xs text-gray-400">
                  Register a custom franchise with arena information and logo. Added teams are immediately available for fixtures and match control.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddTeam} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Team Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Seattle Kraken or Halifax Mariners"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                    required
                  />
                </div>

                {/* Short Code */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Short Code (3-4 Letters)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={teamShortCode}
                    onChange={(e) => setTeamShortCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SEA"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all uppercase"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={teamCity}
                    onChange={(e) => setTeamCity(e.target.value)}
                    placeholder="e.g. Seattle, WA"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  />
                </div>

                {/* Stadium */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Home Stadium / Arena
                  </label>
                  <input
                    type="text"
                    value={teamStadium}
                    onChange={(e) => setTeamStadium(e.target.value)}
                    placeholder="e.g. Climate Pledge Arena"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  />
                </div>

                {/* Primary Color Picker */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Primary Team Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={teamColor}
                      onChange={(e) => setTeamColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-gray-200 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={teamColor}
                      onChange={(e) => setTeamColor(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono uppercase focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                {/* Crest Mode Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Logo / Crest Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCrestMode('auto')}
                      className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        crestMode === 'auto'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Shield SVG
                    </button>
                    <button
                      type="button"
                      onClick={() => setCrestMode('custom')}
                      className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        crestMode === 'custom'
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo / Crest URL input if custom */}
              {crestMode === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Custom Team Logo URL or Inline SVG
                  </label>
                  <input
                    type="text"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png or <svg>...</svg>"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  />
                </div>
              )}

              {/* Live Preview & Submit Row */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 shrink-0 drop-shadow-md flex items-center justify-center bg-white rounded-xl p-1 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: previewCrest }}
                  />
                  <div>
                    <span className="text-xs font-black text-gray-900 block">
                      {teamName.trim() || 'New Team Crest Preview'}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {teamShortCode.trim() || 'N/A'} • {teamStadium.trim() || 'Arena Stadium'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Team to League</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FIELD 2: PLAYERS VIEW                                     */}
      {/* ========================================================= */}
      {activeSubTab === 'players' && (
        <div className="space-y-6">
          {/* Top Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Search player name or #number..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                />
              </div>

              {/* Team Selector */}
              <div className="w-full sm:w-56">
                <select
                  value={playerTeamFilter}
                  onChange={(e) => setPlayerTeamFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white outline-hidden cursor-pointer"
                >
                  <option value="all">All Teams ({players.length} Players)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.lineup?.length || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Position Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto w-full md:w-auto">
              {['all', 'C', 'LW', 'RW', 'D', 'G'].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPlayerPositionFilter(pos)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    playerPositionFilter === pos
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {pos === 'all' ? 'All Pos' : pos}
                </button>
              ))}
            </div>
          </div>

          {/* Players Directory List */}
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
            {filteredPlayers.length === 0 ? (
              <div className="py-12 px-4 text-center text-gray-400 text-xs">
                No players match your search criteria. You can add a player below.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px bg-gray-100">
                {filteredPlayers.map((player) => (
                  <div 
                    key={player.id} 
                    className="p-3.5 bg-white hover:bg-gray-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Jersey Number Pill */}
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        #{player.number}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900 truncate">
                            {player.name}
                          </span>
                          {player.captain && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md">
                              {player.captain}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                            player.pos === 'G' 
                              ? 'bg-amber-100 text-amber-800' 
                              : player.pos === 'D' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {player.pos}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400 truncate">
                          <span className="font-semibold text-gray-600">{player.teamName}</span>
                          <span>•</span>
                          <span>{player.nationality || 'CAN'}</span>
                        </div>
                      </div>
                    </div>

                    {player.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeletePlayer(player.teamId, player.id, player.name)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Delete player from roster"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* AT BOTTOM: ADD CUSTOM PLAYER FORM                         */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Add Custom Player to Roster</h3>
                <p className="text-xs text-gray-400">
                  Register a new player into any official or custom team roster. The player will immediately be available for goal scoring, shot tracking, and lineups.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Player Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Player Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. Macklin Celebrini"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                    required
                  />
                </div>

                {/* Team Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Assign to Team <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={playerTeamId}
                    onChange={(e) => setPlayerTeamId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white outline-hidden cursor-pointer"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.isCustom ? 'Custom' : 'Official'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jersey Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Jersey Number (#)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value)}
                    placeholder="e.g. 71"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Position
                  </label>
                  <select
                    value={playerPosition}
                    onChange={(e) => setPlayerPosition(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white outline-hidden cursor-pointer"
                  >
                    <option value="C">Center (C)</option>
                    <option value="LW">Left Wing (LW)</option>
                    <option value="RW">Right Wing (RW)</option>
                    <option value="D">Defenseman (D)</option>
                    <option value="G">Goaltender (G)</option>
                  </select>
                </div>

                {/* Captaincy */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Captaincy Status
                  </label>
                  <select
                    value={playerCaptain}
                    onChange={(e) => setPlayerCaptain(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white outline-hidden cursor-pointer"
                  >
                    <option value="">Regular Player</option>
                    <option value="A">Alternate Captain (A)</option>
                    <option value="C">Captain (C)</option>
                  </select>
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nationality (3 Letters)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={playerNationality}
                    onChange={(e) => setPlayerNationality(e.target.value.toUpperCase())}
                    placeholder="CAN, USA, SWE, FIN..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all uppercase"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Player to League Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
