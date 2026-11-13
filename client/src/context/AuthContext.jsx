import { createContext, useEffect, useState } from 'react';
import authService from '../services/authService';
export const AuthContext = createContext(null);
const readProfile = () => {
  try {
    const profile = JSON.parse(localStorage.getItem('droppilot_user'));
    return profile && typeof profile.name === 'string' && profile.name.trim() ? profile : null;
  } catch {
    return null;
  }
};
const saveProfile = profile => {
  try {
    localStorage.setItem('droppilot_user', JSON.stringify(profile));
  } catch {}
};
export function AuthProvider({
  children
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const profile = readProfile();
      const token = localStorage.getItem('token');
      let next = null;
      if (profile?.sessionMode === 'demo') {
        next = profile;
      } else if (token && token !== 'mock_jwt_token') {
        try {
          const result = await authService.getCurrentUser();
          if (typeof result.data?.user?.name === 'string' && result.data.user.name.trim()) {
            next = {
              ...profile,
              ...result.data.user,
              sessionMode: 'api'
            };
            saveProfile(next);
          } else localStorage.removeItem('token');
        } catch {
          localStorage.removeItem('token');
        }
      } else if (profile && !profile.sessionMode && !token) {
        next = {
          ...profile,
          sessionMode: 'demo'
        };
        saveProfile(next);
      } else if (token === 'mock_jwt_token') {
        localStorage.removeItem('token');
        localStorage.removeItem('droppilot_user');
      }
      if (!cancelled) {
        setUser(next);
        setLoading(false);
      }
    }
    initialize();
    return () => {
      cancelled = true;
    };
  }, []);
  function login(token, profile) {
    if (token) localStorage.setItem('token', token);else localStorage.removeItem('token');
    saveProfile(profile);
    setUser(profile);
  }
  function updateProfile(patch) {
    setUser(current => {
      const next = {
        ...current,
        ...patch
      };
      saveProfile(next);
      return next;
    });
  }
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('droppilot_user');
    setUser(null);
  }
  return <AuthContext.Provider value={{
    user,
    loading,
    login,
    updateProfile,
    logout,
    isAuthenticated: Boolean(user)
  }}>{children}</AuthContext.Provider>;
}
export default AuthContext;
