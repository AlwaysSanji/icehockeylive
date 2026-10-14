import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { isFirebaseConfigured, saveCustomFirebaseConfig, clearCustomFirebaseConfig, activeConfig } from '../firebase/config';

export function FirebaseModal({ onClose }) {
  const [apiKey, setApiKey] = useState(activeConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(activeConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(activeConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(activeConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(activeConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(activeConfig?.appId || '');

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('Please provide at least apiKey and projectId.');
      return;
    }
    saveCustomFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Firebase Firestore Connection</h3>
              <p className="text-xs text-gray-400">Real-time sync across devices and cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 border ${
          isFirebaseConfigured
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-blue-50/70 border-blue-200 text-blue-900'
        }`}>
          {isFirebaseConfigured ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed">
            {isFirebaseConfigured ? (
              <div>
                <span className="font-bold">Connected to Firebase Cloud ({activeConfig?.projectId || 'icehockeylive-01'})!</span>
                <p className="mt-0.5 text-emerald-700">All score, clock, and match changes synchronize in real-time across Vercel, Firebase Firestore, and all connected spectator devices.</p>
              </div>
            ) : (
              <div>
                <span className="font-bold">Connecting to Firebase...</span>
                <p className="mt-0.5 text-blue-700">
                  Enter or verify your Firebase project credentials below to synchronize all scoreboards.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-hockey-app"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="my-app.firebaseapp.com"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Storage Bucket</label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="my-app.appspot.com"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {isFirebaseConfigured ? (
              <button
                type="button"
                onClick={clearCustomFirebaseConfig}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Clear Credentials
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
