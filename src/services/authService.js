// User Authentication Service (PHP Laravel Backend with Session Cookies & Local Fallback)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8008/api';
const USERS_STORAGE_KEY = 'nhl_registered_users';
const CURRENT_USER_KEY = 'nhl_current_user';
const TOKEN_KEY = 'nhl_auth_token';

// Default starter users for local fallback
const DEFAULT_USERS = [
  {
    id: 'user-admin',
    name: 'Scorekeeper (Admin)',
    username: 'admin',
    email: 'admin@icehockey.com',
    password: 'password',
    role: 'admin',
    canControlRemote: true,
  },
  {
    id: 'user-operator',
    name: 'Game Operator',
    username: 'operator',
    email: 'operator@icehockey.com',
    password: 'password',
    role: 'operator',
    canControlRemote: true,
  },
  {
    id: 'user-1',
    name: 'Spectator User',
    username: 'user',
    email: 'user@icehockey.com',
    password: 'password',
    role: 'viewer',
    canControlRemote: false,
  }
];

export function getRegisteredUsers() {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) {
      const users = JSON.parse(data);
      let needsSave = false;
      const normalized = users.map(u => {
        let role = u.role;
        let canControlRemote = u.canControlRemote;
        if (!role) {
          needsSave = true;
          if (u.username === 'admin' || u.email?.includes('admin')) {
            role = 'admin';
            canControlRemote = true;
          } else if (u.username === 'operator' || u.email?.includes('operator')) {
            role = 'operator';
            canControlRemote = true;
          } else {
            role = 'viewer';
            canControlRemote = false;
          }
        }
        return {
          ...u,
          role,
          canControlRemote: canControlRemote ?? (role === 'admin' || role === 'operator'),
        };
      });

      // Ensure admin & operator defaults exist
      if (!normalized.some(u => u.username === 'admin')) {
        normalized.unshift(DEFAULT_USERS[0]);
        needsSave = true;
      }
      if (!normalized.some(u => u.username === 'operator')) {
        normalized.splice(1, 0, DEFAULT_USERS[1]);
        needsSave = true;
      }

      if (needsSave) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
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

    const role = data.user.role || (data.user.username === 'admin' ? 'admin' : (data.user.username === 'operator' ? 'operator' : 'viewer'));
    const canControlRemote = data.user.canControlRemote ?? (role === 'admin' || role === 'operator');

    const user = {
      id: String(data.user.id),
      name: data.user.name,
      username: data.user.username,
      email: data.user.email,
      role,
      canControlRemote,
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

    const role = data.user.role || (data.user.username === 'admin' ? 'admin' : (data.user.username === 'operator' ? 'operator' : 'viewer'));
    const canControlRemote = data.user.canControlRemote ?? (role === 'admin' || role === 'operator');

    const user = {
      id: String(data.user.id),
      name: data.user.name,
      username: data.user.username,
      email: data.user.email,
      role,
      canControlRemote,
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
        const role = data.user.role || (data.user.username === 'admin' ? 'admin' : (data.user.username === 'operator' ? 'operator' : 'viewer'));
        const canControlRemote = data.user.canControlRemote ?? (role === 'admin' || role === 'operator');

        const user = {
          id: String(data.user.id),
          name: data.user.name,
          username: data.user.username,
          email: data.user.email,
          role,
          canControlRemote,
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
      const parsed = JSON.parse(data);
      if (!parsed.role) {
        parsed.role = (parsed.username === 'admin' || parsed.email?.includes('admin'))
          ? 'admin'
          : (parsed.username === 'operator' || parsed.email?.includes('operator') ? 'operator' : 'viewer');
        parsed.canControlRemote = parsed.role === 'admin' || parsed.role === 'operator';
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading current user session:', e);
  }
  return null;
}

export function setCurrentUser(user) {
  const role = user.role || ((user.username === 'admin' || user.email?.includes('admin')) ? 'admin' : ((user.username === 'operator' || user.email?.includes('operator')) ? 'operator' : 'viewer'));
  const canControlRemote = user.canControlRemote !== undefined ? user.canControlRemote : (role === 'admin' || role === 'operator');

  sessionStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role,
      canControlRemote,
    })
  );
}

/**
 * Access Control Helpers
 */
export function canUserAccessRemote(user) {
  if (!user) return false;
  if (user.canControlRemote === true) return true;
  if (user.role === 'admin' || user.role === 'operator') return true;
  const username = (user.username || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  if (username === 'admin' || username === 'operator') return true;
  if (email === 'admin@icehockey.com' || email === 'admin@nhl.com' || email === 'operator@icehockey.com' || email === 'operator@nhl.com') return true;
  return false;
}

export function isUserAdmin(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const username = (user.username || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  return username === 'admin' || email === 'admin@icehockey.com' || email === 'admin@nhl.com';
}

export function getAllRegisteredUsers() {
  return getRegisteredUsers();
}

export function toggleUserRemoteAccess(userId) {
  const users = getRegisteredUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId || u.username === userId || u.email === userId) {
      const willHaveAccess = !u.canControlRemote;
      return {
        ...u,
        canControlRemote: willHaveAccess,
        role: willHaveAccess ? (u.role === 'admin' ? 'admin' : 'operator') : 'viewer',
      };
    }
    return u;
  });
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  // Sync active session if the current user was updated
  const current = getCurrentUser();
  if (current && (current.id === userId || current.username === userId || current.email === userId)) {
    const updatedCurrent = updatedUsers.find(u => u.id === current.id || u.username === current.username);
    if (updatedCurrent) {
      setCurrentUser(updatedCurrent);
    }
  }

  return updatedUsers;
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

  const isInitialAdmin = cleanUsername === 'admin' || cleanEmail === 'admin@icehockey.com' || cleanEmail === 'admin@nhl.com';
  const isInitialOperator = cleanUsername === 'operator' || cleanEmail === 'operator@icehockey.com' || cleanEmail === 'operator@nhl.com';
  const role = isInitialAdmin ? 'admin' : (isInitialOperator ? 'operator' : 'viewer');
  const canControlRemote = isInitialAdmin || isInitialOperator;

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim() || cleanUsername,
    username: cleanUsername,
    email: cleanEmail,
    password: password,
    role,
    canControlRemote
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
      (cleanIdentifier === 'operator' && cleanPassword === 'password') ||
      (cleanIdentifier === 'user' && cleanPassword === 'password')
    ) {
      const role = cleanIdentifier === 'admin' ? 'admin' : (cleanIdentifier === 'operator' ? 'operator' : 'viewer');
      const fallbackUser = {
        id: `user-${cleanIdentifier}`,
        name: cleanIdentifier === 'admin' ? 'Scorekeeper (Admin)' : (cleanIdentifier === 'operator' ? 'Game Operator' : 'Spectator User'),
        username: cleanIdentifier,
        email: `${cleanIdentifier}@icehockey.com`,
        role,
        canControlRemote: role === 'admin' || role === 'operator'
      };
      setCurrentUser(fallbackUser);
      return fallbackUser;
    }

    throw new Error('Invalid email/username or password.');
  }

  setCurrentUser(user);
  return user;
}
