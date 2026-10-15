import React, { useState } from 'react';
import { X, Shield, FileText, Lock, CheckCircle } from 'lucide-react';

export function LegalModal({ initialTab = 'privacy', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              {activeTab === 'privacy' ? <Shield className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <p className="text-xs text-gray-400">Last updated: October 2026</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('tos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Terms of Service
          </button>
        </div>

        {/* Content Area with smooth scrolling */}
        <div className="overflow-y-auto pr-2 py-4 text-xs text-gray-600 space-y-4 leading-relaxed">
          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">1. Information We Collect</h4>
                <p>
                  When you create an account or sign in to our Live Scoreboard system, we collect your name, email address, and username. We also log session identifiers, cookies, and network IP addresses for security, rate-limiting, and authentication purposes.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">2. Password Security & Hashing</h4>
                <p>
                  All passwords are cryptographically hashed using industry-standard hashing algorithms (Bcrypt / Argon2id) via our PHP Laravel backend before being stored. Plaintext passwords are never logged, stored, or accessible by administrators or third parties.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">3. Sessions & Cookie Usage</h4>
                <p>
                  We utilize encrypted, secure, HTTP-only session cookies (<code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">laravel_session</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">XSRF-TOKEN</code>) to maintain your authenticated session state and protect against Cross-Site Request Forgery (CSRF). Cookies expire when your session ends or upon logout.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">4. Rate Limiting & Abuse Prevention</h4>
                <p>
                  To protect user accounts from brute-force attacks and abuse, our backend enforces strict request rate limiting. Repeated unauthorized requests or rapid authentication attempts will temporarily throttle access.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">5. Real-Time Data Synchronization</h4>
                <p>
                  Scoreboard actions (goal updates, clock starts, period changes) are synced in real time via secure websockets and cloud database streams (Firebase Firestore) across connected spectator screens and stadium jumbotrons.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">1. Acceptance of Terms</h4>
                <p>
                  By accessing or using the Live Scoreboard & Operator Remote, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">2. Operator Account Responsibilities</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and password. Any actions taken through your authenticated session (such as score modifications, clock resets, or match event entries) are your responsibility.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">3. Acceptable Use & Rate Limiting</h4>
                <p>
                  Users may not attempt to reverse engineer, bypass authentication, flood API endpoints, or interfere with real-time match synchronization. Any attempt to circumvent our rate limiting or automated protections will result in immediate termination of operator privileges.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">4. Intellectual Property & Trademarks</h4>
                <p>
                  Team names, logos, colors, and associated stadium brands are trademarks of their respective clubs. This application is intended for live game tracking and scorekeeping.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 text-sm mb-1">5. Disclaimer of Warranties</h4>
                <p>
                  The service is provided on an "as is" and "as available" basis without warranties of any kind. While we strive for sub-millisecond clock synchronization and persistent database reliability, we do not guarantee uninterrupted uptime during arena matches.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Encrypted with PHP Laravel Security</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
