import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import {
  ensureUserProfile,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/auth';
import type { UserProfile, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    school?: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (next) {
        try {
          const p = await ensureUserProfile(next);
          setProfile(p);
        } catch (err) {
          console.error(err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await ensureUserProfile(user);
    setProfile(p);
  }, [user]);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName: string;
      role: UserRole;
      school?: string;
    }) => {
      const p = await registerUser(input);
      setProfile(p);
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    await loginUser(email, password);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      refreshProfile,
      register,
      login,
      logout,
    }),
    [user, profile, loading, refreshProfile, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
