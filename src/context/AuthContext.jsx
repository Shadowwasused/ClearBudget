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

const SUSPENDED_MESSAGE =
  "Your ClearBudget account has been suspended. Please contact support if you believe this was a mistake.";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(true);

  const [authMessage, setAuthMessage] =
    useState("");

  /*
   * Each profile request receives a number.
   * Older requests cannot overwrite a newer result.
   */
  const profileRequestId = useRef(0);

  const clearLocalAuthState = useCallback(() => {
    profileRequestId.current += 1;

    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
  }, []);

  const signOutSuspendedUser =
    useCallback(async () => {
      /*
       * Clear the local state first so the protected
       * application disappears immediately.
       */
      clearLocalAuthState();
      setAuthMessage(SUSPENDED_MESSAGE);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Unable to sign out suspended user:",
          error,
        );
      }
    }, [clearLocalAuthState]);

  const loadProfile = useCallback(
    async (userId) => {
      const requestId =
        ++profileRequestId.current;

      if (!userId) {
        setProfile(null);
        setProfileLoading(false);
        return null;
      }

      try {
        setProfileLoading(true);

        const currentProfile =
          await fetchMyProfile(userId);

        if (
          requestId !==
          profileRequestId.current
        ) {
          return null;
        }

        if (
          currentProfile?.accountStatus ===
          "suspended"
        ) {
          await signOutSuspendedUser();
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
         * Do not erase an already loaded profile
         * because of a temporary request failure.
         */
        if (
          requestId ===
          profileRequestId.current
        ) {
          setProfile((current) => current);
        }

        return null;
      } finally {
        if (
          requestId ===
          profileRequestId.current
        ) {
          setProfileLoading(false);
        }
      }
    },
    [signOutSuspendedUser],
  );

  const applySession = useCallback(
    async (nextSession) => {
      const nextUser =
        nextSession?.user ?? null;

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
          data: {
            session: initialSession,
          },
          error,
        } =
          await supabase.auth.getSession();

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
          clearLocalAuthState();
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
  }, [applySession, clearLocalAuthState]);

  const signUp = useCallback(
    async ({
      email,
      password,
      fullName,
    }) => {
      setAuthMessage("");

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
      setAuthMessage("");

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      /*
       * Verify account status before allowing the
       * login flow to continue.
       */
      const signedInUser = data?.user;

      if (signedInUser?.id) {
        const currentProfile =
          await fetchMyProfile(
            signedInUser.id,
          );

        if (
          currentProfile?.accountStatus ===
          "suspended"
        ) {
          await signOutSuspendedUser();

          throw new Error(
            SUSPENDED_MESSAGE,
          );
        }
      }

      return data;
    },
    [signOutSuspendedUser],
  );

  const signOut = useCallback(async () => {
    setAuthMessage("");

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    clearLocalAuthState();
  }, [clearLocalAuthState]);

  const resetPassword = useCallback(
    async (email) => {
      setAuthMessage("");

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

  const refreshProfile =
    useCallback(async () => {
      if (!user?.id) {
        return null;
      }

      return loadProfile(user.id);
    }, [user?.id, loadProfile]);

  const clearAuthMessage =
    useCallback(() => {
      setAuthMessage("");
    }, []);

  const isAdmin =
    profile?.role === "admin";

  const isSuspended =
    profile?.accountStatus ===
    "suspended";

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      profileLoading,
      authMessage,
      isAdmin,
      isSuspended,
      refreshProfile,
      clearAuthMessage,
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
      authMessage,
      isAdmin,
      isSuspended,
      refreshProfile,
      clearAuthMessage,
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
  const context = useContext(
    AuthContext,
  );

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  return context;
}