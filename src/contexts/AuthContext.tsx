import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthUser = { email: string; name: string };

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
}

const USER_STORAGE_KEY = 'psiem_user';
const REMEMBER_KEY = 'psiem_remember';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const hydrateUser = () => {
    const rememberValue = localStorage.getItem(REMEMBER_KEY);
    const savedRemember = rememberValue === 'true';

    const rawUser =
      (savedRemember ? localStorage.getItem(USER_STORAGE_KEY) : sessionStorage.getItem(USER_STORAGE_KEY)) ||
      localStorage.getItem(USER_STORAGE_KEY);

    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch (error) {
      console.error('Failed to parse stored user', error);
      return null;
    }
  };

  useEffect(() => {
    const storedUser = hydrateUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedPassword) {
      throw new Error('Email and password are required');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      throw new Error('Enter a valid email address');
    }

    if (trimmedPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockUser: AuthUser = {
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0] || 'Security Admin',
        };

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
        localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');

        // Clear the alternate storage to avoid stale sessions.
        if (rememberMe) {
          sessionStorage.removeItem(USER_STORAGE_KEY);
        } else {
          localStorage.removeItem(USER_STORAGE_KEY);
        }

        setUser(mockUser);
        setIsAuthenticated(true);
        resolve();
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
