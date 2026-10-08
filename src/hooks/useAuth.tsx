import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { LoginCredentials, RegisterPayload, User } from '../models';
import { authService } from '../services/authService';
import { registerPushNotifications, unregisterPushNotifications } from '../services/pushNotificationService';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const registering = useRef(false);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const unsubscribe = authService.subscribe((firebaseUser) => {
      const currentRevision = ++revision;
      if (!firebaseUser) {
        if (active) {
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
        }
        return;
      }

      // Registration writes its complete profile directly before publishing the user to the UI.
      if (registering.current) return;

      setLoading(true);
      void authService.getProfile(firebaseUser)
        .then((profile) => {
          if (active && revision === currentRevision) setUser(profile);
        })
        .catch((error) => {
          console.warn('Failed to load Firebase user profile:', error);
          if (active && revision === currentRevision) setUser(null);
        })
        .finally(() => {
          if (active && revision === currentRevision) {
            setLoading(false);
            setIsInitialized(true);
          }
        });
    }, (error) => {
      console.warn('Firebase auth state listener failed:', error);
      if (active) {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void registerPushNotifications(user.id, () => active).catch((error) => {
      console.warn('Push notification registration failed:', error);
    });
    return () => {
      active = false;
      void unregisterPushNotifications(user.id).catch((error) => {
        console.warn('Push token cleanup failed:', error);
      });
    };
  }, [user?.id]);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      await authService.login(credentials);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    registering.current = true;
    setLoading(true);
    try {
      setUser(await authService.register(payload));
    } finally {
      registering.current = false;
      setLoading(false);
    }
  };

  const logout = () => authService.logout();

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    setUser(await authService.updateProfile(user.id, updates));
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isInitialized,
    isLoading,
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
