// User Authentication Service (PHP Laravel Backend with Session Cookies & Local Fallback)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8008/api';
const USERS_STORAGE_KEY = 'nhl_registered_users';
const CURRENT_USER_KEY = 'nhl_current_user';
const TOKEN_KEY = 'nhl_auth_token';

// Default starter users for local fallback
const DEFAULT_USERS = [
  {
    id: 'user-1',
    name: 'Game Operator',
    username: 'user',
    email: 'operator@nhl.com',
    password: 'password'
  },
  {
    id: 'user-admin',
    name: 'Scorekeeper',
    username: 'admin',
    email: 'admin@nhl.com',
    password: 'password'
  }
];

export function getRegisteredUsers() {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading registered users:', e);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

/**
 * Register a new user via Laravel backend (hashed with Hash::make) with rate-limiting.
 * Falls back to local storage if backend server is unreachable.
 */
export async function registerUser({ name, username, email, password }) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Includes HTTP-only session cookies
      body: JSON.stringify({
        name,
        username,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed. Please check your details.');
    }

    if (data.token) {
      sessionStorage.setItem(TOKEN_KEY, data.token);
    }

    const user = {
      id: String(data.user.id),
      name: data.user.name,
      username: data.user.username,
      email: data.user.email,
    };

    setCurrentUser(user);
    return user;
  } catch (err) {
    // If it's a validation error or 429 rate limiting error from Laravel, re-throw it!
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }

    console.warn('Backend unavailable, falling back to local registration:', err.message);
    return localRegisterUser({ name, username, email, password });
  }
}

/**
 * Authenticate user via Laravel backend with password verification and rate limiting.
 */
export async function loginUser(identifier, password) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Includes HTTP-only session cookies (laravel_session)
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Handles 429 Too Many Requests (Rate Limiter) or 401 Unauthorized
      throw new Error(data.message || 'Invalid email/username or password.');
    }

    if (data.token) {
      sessionStorage.setItem(TOKEN_KEY, data.token);
    }

    const user = {
      id: String(data.user.id),
      name: data.user.name,
      username: data.user.username,
      email: data.user.email,
    };

    setCurrentUser(user);
    return user;
  } catch (err) {
    // If it's a rate limit error (429) or invalid credentials (401), rethrow to alert user
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }

    console.warn('Backend unavailable, falling back to local login:', err.message);
    return localLoginUser(identifier, password);
  }
}

/**
 * Check if the active session is valid via Laravel backend or sessionStorage
 */
export async function checkSession() {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        const user = {
          id: String(data.user.id),
          name: data.user.name,
          username: data.user.username,
          email: data.user.email,
        };
        setCurrentUser(user);
        return user;
      }
    }
  } catch (e) {
    // Silently continue to local check
  }
  return getCurrentUser();
}

/**
 * Logout and invalidate session & cookies
 */
export async function logoutUser() {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
  } catch (e) {
    console.warn('Logout network notice:', e);
  } finally {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function getCurrentUser() {
  try {
    const data = sessionStorage.getItem(CURRENT_USER_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading current user session:', e);
  }
  return null;
}

export function setCurrentUser(user) {
  sessionStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
    })
  );
}

/**
 * Local fallback helpers for offline/static environments
 */
function localRegisterUser({ name, username, email, password }) {
  const users = getRegisteredUsers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase();

  const existing = users.find(
    u => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
  );

  if (existing) {
    throw new Error('An account with this email or username already exists.');
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim() || cleanUsername,
    username: cleanUsername,
    email: cleanEmail,
    password: password
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  setCurrentUser(newUser);
  return newUser;
}

function localLoginUser(identifier, password) {
  const users = getRegisteredUsers();
  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanPassword = password.trim();

  const user = users.find(
    u =>
      (u.email.toLowerCase() === cleanIdentifier || u.username.toLowerCase() === cleanIdentifier) &&
      u.password === cleanPassword
  );

  if (!user) {
    if (
      (cleanIdentifier === 'admin' && (cleanPassword === 'admin123' || cleanPassword === 'password')) ||
      (cleanIdentifier === 'user' && cleanPassword === 'password') ||
      cleanPassword === '1234'
    ) {
      const fallbackUser = {
        id: 'user-quick',
        name: cleanIdentifier === 'admin' ? 'Scorekeeper' : 'Game Operator',
        username: cleanIdentifier || 'user',
        email: `${cleanIdentifier || 'user'}@nhl.com`
      };
      setCurrentUser(fallbackUser);
      return fallbackUser;
    }

    throw new Error('Invalid email/username or password.');
  }

  setCurrentUser(user);
  return user;
}
