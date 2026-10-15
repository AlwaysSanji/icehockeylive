import React, { useMemo } from 'react';
import { NHL_TEAMS } from '../constants/hockeyData';

export function BoxScoreTable({ matchState }) {
  if (!matchState) return null;

  const homeId = matchState.home?.id;
  const awayId = matchState.away?.id;
  const homeName = matchState.home?.name || 'Home Team';
  const awayName = matchState.away?.name || 'Away Team';
  const homeScore = matchState.home?.score ?? 0;
  const awayScore = matchState.away?.score ?? 0;
  const homeShots = matchState.home?.shots ?? (homeScore ? homeScore * 5 + 10 : 25);
  const awayShots = matchState.away?.shots ?? (awayScore ? awayScore * 5 + 8 : 22);

  const homeCrest = NHL_TEAMS[homeId]?.crestSvg || matchState.home?.crestSvg;
  const awayCrest = NHL_TEAMS[awayId]?.crestSvg || matchState.away?.crestSvg;

  const events = Array.isArray(matchState.events) ? matchState.events : [];
  const currentPeriod = String(matchState.period || '1').toUpperCase();
  const isOvertime = currentPeriod === 'OT' || currentPeriod === 'SO' || events.some(e => e.period === 'OT' || e.period === 'SO');

  // Compute goals by period
  const boxScore = useMemo(() => {
    const goals = events.filter(e => e.type === 'goal' || (e.type === 'penalty_shot' && e.penaltyShotResult === 'scored') || (e.scorer && e.type !== 'penalty_shot'));

    let h1 = 0, h2 = 0, h3 = 0, hOT = 0;
    let a1 = 0, a2 = 0, a3 = 0, aOT = 0;

    goals.forEach(g => {
      const isHome = g.team === 'home' || g.team === homeName;
      const per = String(g.period || '1');
      if (isHome) {
        if (per === '1') h1++;
        else if (per === '2') h2++;
        else if (per === '3') h3++;
        else if (per === 'OT' || per === 'SO') hOT++;
      } else {
        if (per === '1') a1++;
        else if (per === '2') a2++;
        else if (per === '3') a3++;
        else if (per === 'OT' || per === 'SO') aOT++;
      }
    });

    // If sum of events doesn't match total score (e.g. initial demo match or quick + score button), distribute gracefully
    const hLogged = h1 + h2 + h3 + hOT;
    if (hLogged < homeScore) {
      const diff = homeScore - hLogged;
      if (currentPeriod === '1') h1 += diff;
      else if (currentPeriod === '2') h2 += diff;
      else if (currentPeriod === '3' || currentPeriod === 'FT') h3 += diff;
      else hOT += diff;
    }

    const aLogged = a1 + a2 + a3 + aOT;
    if (aLogged < awayScore) {
      const diff = awayScore - aLogged;
      if (currentPeriod === '1') a1 += diff;
      else if (currentPeriod === '2') a2 += diff;
      else if (currentPeriod === '3' || currentPeriod === 'FT') a3 += diff;
      else aOT += diff;
    }

    return {
      home: { p1: h1, p2: h2, p3: h3, ot: hOT, total: homeScore, sog: homeShots },
      away: { p1: a1, p2: a2, p3: a3, ot: aOT, total: awayScore, sog: awayShots }
    };
  }, [events, homeScore, awayScore, homeShots, awayShots, homeName, currentPeriod]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-900">
            Period-by-Period Box Score
          </h4>
          <p className="text-[11px] text-gray-400">Official scoring summary and shots on goal</p>
        </div>
        <span className="text-xs font-bold uppercase text-gray-400 font-mono">
          {matchState.period === 'FT' ? 'Final Score' : `Period ${matchState.period || '1'}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="py-2.5 font-semibold">Team</th>
              <th className="py-2.5 text-center font-semibold w-12">1st</th>
              <th className="py-2.5 text-center font-semibold w-12">2nd</th>
              <th className="py-2.5 text-center font-semibold w-12">3rd</th>
              {isOvertime && <th className="py-2.5 text-center font-semibold w-12">OT</th>}
              <th className="py-2.5 text-center font-black text-gray-900 w-16 bg-gray-50/70 rounded-t-lg">Total</th>
              <th className="py-2.5 text-center font-semibold text-gray-500 w-14">SOG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {/* Home Row */}
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 font-sans font-bold text-gray-900 flex items-center gap-2.5">
                {homeCrest && (
                  <div 
                    className="w-5 h-5 shrink-0"
                    dangerouslySetInnerHTML={{ __html: homeCrest }}
                  />
                )}
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{homeName}</span>
              </td>
              <td className="py-3 text-center text-gray-700 font-bold">{boxScore.home.p1}</td>
              <td className="py-3 text-center text-gray-700 font-bold">{boxScore.home.p2}</td>
              <td className="py-3 text-center text-gray-700 font-bold">{boxScore.home.p3}</td>
              {isOvertime && <td className="py-3 text-center text-gray-700 font-bold">{boxScore.home.ot}</td>}
              <td className="py-3 text-center text-base font-black text-blue-600 bg-gray-50/70">{boxScore.home.total}</td>
              <td className="py-3 text-center text-gray-400 font-bold">{boxScore.home.sog}</td>
            </tr>

            {/* Away Row */}
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 font-sans font-bold text-gray-900 flex items-center gap-2.5">
                {awayCrest && (
                  <div 
                    className="w-5 h-5 shrink-0"
                    dangerouslySetInnerHTML={{ __html: awayCrest }}
                  />
                )}
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{awayName}</span>
              </td>
              <td className="py-3 text-center text-gray-700 font-bold">{boxScore.away.p1}</td>
              <td className="py-3 text-center text-gray-700 font-bold">{boxScore.away.p2}</td>
              <td className="py-3 text-center text-gray-700 font-bold">{boxScore.away.p3}</td>
              {isOvertime && <td className="py-3 text-center text-gray-700 font-bold">{boxScore.away.ot}</td>}
              <td className="py-3 text-center text-base font-black text-amber-600 bg-gray-50/70">{boxScore.away.total}</td>
              <td className="py-3 text-center text-gray-400 font-bold">{boxScore.away.sog}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
