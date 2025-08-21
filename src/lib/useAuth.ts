import { useState, useEffect } from 'react';
import { AuthState, User, UserRole } from './auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    role: null,
  });

  useEffect(() => {
    const savedAuth = localStorage.getItem('studyspark-auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuthState(parsed);
      } catch (error) {
        console.error('Failed to parse saved auth state:', error);
        localStorage.removeItem('studyspark-auth');
      }
    }
  }, []);

  const login = (user: User) => {
    const newState: AuthState = {
      isAuthenticated: true,
      user,
      role: null,
    };
    setAuthState(newState);
    localStorage.setItem('studyspark-auth', JSON.stringify(newState));
  };

  const selectRole = (role: UserRole) => {
    const newState: AuthState = {
      ...authState,
      role,
    };
    setAuthState(newState);
    localStorage.setItem('studyspark-auth', JSON.stringify(newState));
  };

  const logout = () => {
    const newState: AuthState = {
      isAuthenticated: false,
      user: null,
      role: null,
    };
    setAuthState(newState);
    localStorage.removeItem('studyspark-auth');
  };

  return {
    ...authState,
    login,
    selectRole,
    logout,
  };
};