import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  onAuthChange,
  registerWithEmail,
} from "../lib/auth";

interface AuthContextShape {
  user: User | null;
  loading: boolean;
  loginEmail: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  registerEmail: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextShape>(
    () => ({
      user,
      loading,
      loginEmail: async (email: string, password: string) => {
        await loginWithEmail(email, password);
      },
      loginGoogle: async () => {
        await loginWithGoogle();
      },
      registerEmail: async (displayName: string, email: string, password: string) => {
        await registerWithEmail(email, password, displayName);
      },
      logout: async () => {
        await logoutUser();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
