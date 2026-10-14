import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export function TeamEditorModal({ matchState, onSave, onClose }) {
  const [homeName, setHomeName] = useState(matchState.home?.name || '');
  const [awayName, setAwayName] = useState(matchState.away?.name || '');
  const [venue, setVenue] = useState(matchState.venue || '');
  const [referee, setReferee] = useState(matchState.referee || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      home: {
        ...matchState.home,
        name: homeName.trim() || 'Home Team'
      },
      away: {
        ...matchState.away,
        name: awayName.trim() || 'Away Team'
      },
      venue: venue.trim() || 'United Center',
      referee: referee.trim() || 'Furlatt E.'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit Teams & Match Info</h3>
            <p className="text-xs text-gray-400">Updates live across all displays and scoreboards</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Home Team</label>
            <input
              type="text"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              placeholder="Chicago Blackhawks"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Away Team</label>
            <input
              type="text"
              value={awayName}
              onChange={(e) => setAwayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              placeholder="Pittsburgh Penguins"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stadium / Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                placeholder="United Center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Head Referee</label>
              <input
                type="text"
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                placeholder="Furlatt E."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save & Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
