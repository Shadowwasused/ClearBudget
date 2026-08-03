import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabase";
import { fetchMyProfile } from "../lib/profileApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(true);

  /*
   * Each profile request receives a number.
   * Older requests cannot overwrite a newer result.
   */
  const profileRequestId = useRef(0);

  const loadProfile = useCallback(async (userId) => {
    const requestId = ++profileRequestId.current;

    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    try {
      setProfileLoading(true);

      const currentProfile =
        await fetchMyProfile(userId);

      if (requestId !== profileRequestId.current) {
        return null;
      }

      setProfile(currentProfile);

      return currentProfile;
    } catch (error) {
      console.error(
        "Unable to load ClearBudget profile:",
        error,
      );

      /*
       * Do not erase an already loaded admin profile
       * because of a temporary network or duplicate-request
       * failure.
       */
      if (requestId === profileRequestId.current) {
        setProfile((current) => current);
      }

      return null;
    } finally {
      if (requestId === profileRequestId.current) {
        setProfileLoading(false);
      }
    }
  }, []);

  const applySession = useCallback(
    async (nextSession) => {
      const nextUser = nextSession?.user ?? null;

      setSession(nextSession ?? null);
      setUser(nextUser);

      if (nextUser?.id) {
        await loadProfile(nextUser.id);
      } else {
        profileRequestId.current += 1;
        setProfile(null);
        setProfileLoading(false);
      }
    },
    [loadProfile],
  );

  useEffect(() => {
    let active = true;

    async function initializeAuthentication() {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        await applySession(initialSession);
      } catch (error) {
        console.error(
          "Unable to initialize authentication:",
          error,
        );

        if (active) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuthentication();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!active) {
          return;
        }

        /*
         * Complete session/profile updates together.
         */
        await applySession(nextSession);

        if (active) {
          setLoading(false);
        }
      },
    );

    return () => {
      active = false;
      profileRequestId.current += 1;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp = useCallback(
    async ({ email, password, fullName }) => {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo:
              "https://www.clearbudgetapp.com/auth/callback",
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

    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
  }, []);

  const resetPassword = useCallback(
    async (email) => {
      const { data, error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              "https://www.clearbudgetapp.com/reset-password",
          },
        );

      if (error) {
        throw error;
      }

      return data;
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      return null;
    }

    return loadProfile(user.id);
  }, [user?.id, loadProfile]);

  const isAdmin = profile?.role === "admin";

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      profileLoading,
      isAdmin,
      refreshProfile,
      signUp,
      signIn,
      signOut,
      resetPassword,
    }),
    [
      session,
      user,
      profile,
      loading,
      profileLoading,
      isAdmin,
      refreshProfile,
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