import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, CheckCircle, UserPlus, LogIn } from 'lucide-react';
import { loginUser, registerUser } from '../services/authService';

export function AuthView({ onAuthSuccess, onBackToPublic, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const user = await loginUser(loginIdentifier, loginPassword);
      setSuccess('Authenticated! Redirecting to scoreboard...');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 200);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (registerPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await registerUser({
        name,
        username,
        email,
        password: registerPassword
      });
      setSuccess('Account created successfully! Redirecting to scoreboard...');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 200);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-100">
        {/* Top Icon */}
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          {mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
        </div>

        {/* Header Title & Subtitle */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {mode === 'login' ? 'Sign In to Your Account' : 'Create New Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'login'
              ? 'Access live scoreboard operator controls'
              : 'Sign up to control live matches in real time'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* --- 1. LOGIN FORM --- */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Username or email"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center"
            >
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
            </button>
          </form>
        ) : (
          /* --- 2. CREATE ACCOUNT FORM --- */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center"
            >
              <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>
        )}

        {/* Toggle between Login and Create Account */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs">
          {mode === 'login' ? (
            <p className="text-gray-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('register');
                }}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p className="text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('login');
                }}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Back to Public View Link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onBackToPublic}
            className="text-xs text-gray-500 hover:text-gray-800 font-semibold inline-flex items-center transition-colors"
          >
            <span>Return to Public Scoreboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
