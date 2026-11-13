import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedProfile = localStorage.getItem('droppilot_user');
      const localUser = savedProfile ? JSON.parse(savedProfile) : null;
      if (token) {
        try {
          const res = await authService.getCurrentUser();
          const authenticatedUser = res.data?.user || localUser;
          setUser(authenticatedUser);
          if (authenticatedUser) localStorage.setItem('droppilot_user', JSON.stringify(authenticatedUser));
        } catch (err) {
          localStorage.removeItem('token');
          setUser(localUser);
        }
      } else {
        setUser(localUser);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token, userData) => {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('droppilot_user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateProfile = (profile) => {
    const nextUser = { ...user, ...profile };
    localStorage.setItem('droppilot_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('droppilot_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateProfile, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

