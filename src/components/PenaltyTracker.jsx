import React from 'react';
import { ShieldAlert, Zap, X } from 'lucide-react';

export function PenaltyTracker({ 
  matchState, 
  onCancelPenalty, 
  isOperator = false 
}) {
  if (!matchState) return null;

  const events = Array.isArray(matchState.events) ? matchState.events : [];
  const penalties = events.filter(e => e.type === 'penalty');
  const penaltyShots = events.filter(e => e.type === 'penalty_shot');
  const powerPlay = matchState.powerPlay; // 'home', 'away', or null

  const homeName = matchState.home?.name || 'Home';
  const awayName = matchState.away?.name || 'Away';

  if (!powerPlay && penalties.length === 0 && penaltyShots.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-3xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-950 text-xs sm:text-sm uppercase tracking-wide">
                Special Teams & Penalty Tracker
              </span>
              {powerPlay && (
                <span className="font-black text-xs uppercase tracking-wider text-amber-600">
                  • {powerPlay === 'home' ? `${homeName} Power Play` : `${awayName} Power Play`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-800/80">
              {powerPlay ? `Man advantage in progress (5 on 4)` : `Recorded match penalties & penalty shot attempts`}
            </p>
          </div>
        </div>

        {isOperator && onCancelPenalty && powerPlay && (
          <button
            type="button"
            onClick={() => onCancelPenalty(powerPlay)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            End Power Play
          </button>
        )}
      </div>

      {/* Recorded Penalty Shots (Score or Miss) */}
      {penaltyShots.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wide px-1">
            Penalty Shot Attempts ({penaltyShots.length})
          </div>
          {penaltyShots.map((ps, idx) => {
            const isHome = ps.team === 'home' || ps.team === homeName;
            const shootingTeamName = isHome ? homeName : awayName;
            const isScored = ps.penaltyShotResult === 'scored';

            return (
              <div
                key={ps.id || idx}
                className={`bg-white/95 backdrop-blur-xs rounded-2xl p-3 border flex items-center justify-between gap-3 text-xs ${
                  isScored ? 'border-emerald-300/80 shadow-2xs' : 'border-rose-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                      <span className="text-gray-500 font-semibold">{shootingTeamName}: </span>
                      <strong className="text-gray-950 font-black">{ps.player || ps.scorer || 'Shooter'}</strong>
                      {ps.goalie && <span className="text-gray-400 font-normal">vs {ps.goalie}</span>}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Period {ps.period || '1'} • Clock {ps.time || '10:00'} {ps.missReason ? `• ${ps.missReason}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-bold text-xs uppercase tracking-wider ${
                    isScored ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isScored ? 'Goal Scored' : 'Missed / Saved'}
                  </span>
                  {isOperator && onCancelPenalty && (
                    <button
                      type="button"
                      onClick={() => onCancelPenalty(ps.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete penalty shot incident"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Penalties List */}
      <div className="space-y-2">
        {penalties.slice(0, 3).map((p, idx) => {
          const isHome = p.team === 'home' || p.team === homeName;
          const penalizedTeamName = isHome ? homeName : awayName;

          return (
            <div
              key={p.id || idx}
              className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">
                    <span className="text-gray-500 font-semibold">{penalizedTeamName}: </span>
                    <strong className="text-gray-950 font-black">{p.player || p.penaltyPlayer || 'Player'}</strong>
                    <span className="text-amber-800 ml-1.5">({p.infraction || p.reason || 'Penalty'})</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Period {p.period || '1'} • Clock {p.time || p.minute || '12:00'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-rose-700 font-mono font-bold text-xs">
                  {p.minutes || p.penaltyMinutes || 2} Min PIM
                </span>
                {isOperator && onCancelPenalty && (
                  <button
                    type="button"
                    onClick={() => onCancelPenalty(p.id)}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Clear penalty"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
