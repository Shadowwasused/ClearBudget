import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = 8000;

function withTimeout(promise, milliseconds) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(
          new Error(
            "Supabase session loading timed out.",
          ),
        );
      }, milliseconds);
    }),
  ]);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
        );

        if (!active) {
          return;
        }

        if (response.error) {
          throw response.error;
        }

        const currentSession =
          response.data?.session ?? null;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error(
          "Unable to load Supabase session:",
          error,
        );

        if (active) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) {
          return;
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async ({ email, password, fullName }) => {
      const redirectBaseUrl =
        import.meta.env.VITE_APP_URL ||
        window.location.origin;

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo:
              `${redirectBaseUrl}/auth/callback`,
          },
        });

      if (error) {
        throw error;
      }

      return data;
    },
    [],
  );

  const signIn = useCallback(
    async ({ email, password }) => {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      return data;
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const resetPassword = useCallback(
    async (email) => {
      const redirectBaseUrl =
        import.meta.env.VITE_APP_URL ||
        window.location.origin;

      const { data, error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${redirectBaseUrl}/reset-password`,
          },
        );

      if (error) {
        throw error;
      }

      return data;
    },
    [],
  );

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
    }),
    [
      session,
      user,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  return context;
}