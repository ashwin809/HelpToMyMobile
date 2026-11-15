import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { LoginCredentials, ProfileUpdate, RegisterPayload, User } from '../models';
import { authService } from '../services/authService';
import { registerPushNotifications, unregisterPushNotifications } from '../services/pushNotificationService';
import { onSessionExpired } from '../api/apiClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: ProfileUpdate) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => onSessionExpired(() => {
    setUser(null);
    setSessionExpired(true);
  }), []);

  useEffect(() => {
    let active = true;
    void authService.initialize().then((sessionUser) => {
      if (active) setUser(sessionUser);
    }).finally(() => {
      if (active) {
        setLoading(false);
        setIsInitialized(true);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void registerPushNotifications(user.id, () => active).catch((error) => {
      console.warn('Push notification registration failed:', error);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const login = async (credentials: LoginCredentials) => {
    setSessionExpired(false);
    setLoading(true);
    try {
      setUser(await authService.login(credentials));
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setSessionExpired(false);
    setLoading(true);
    try {
      setUser(await authService.register(payload));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setSessionExpired(false);
    try {
      if (user?.id) {
        await unregisterPushNotifications(user.id).catch((error) => {
          console.warn('Push token cleanup failed:', error);
        });
      }
      await authService.logout();
    } finally {
      setUser(null);
      setSessionExpired(false);
    }
  };

  const updateUser = async (updates: ProfileUpdate) => {
    if (!user) return;
    setUser(await authService.updateProfile(user.id, updates));
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isInitialized,
    isLoading,
    sessionExpired,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
