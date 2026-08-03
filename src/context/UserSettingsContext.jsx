import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

import {
  fetchUserSettings,
  updateUserSettings as saveUserSettings,
} from "../lib/userSettingsApi";

const UserSettingsContext = createContext(null);

const defaultSettings = {
  currency: "USD",
  theme: "role",
  budget_rollover_enabled: false,
  bill_reminders_enabled: false,
  dashboard_period: "month",
  multiple_accounts: false,
  ai_coach_enabled: false,
};

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches
  ) {
    return "dark";
  }

  return "light";
}

function getRoleDefaultTheme(isAdmin) {
  return isAdmin ? "graphite" : "midnight";
}

function resolveTheme({
  selectedTheme,
  isAdmin,
  systemTheme,
}) {
  if (selectedTheme === "system") {
    return systemTheme;
  }

  if (
    !selectedTheme ||
    selectedTheme === "role"
  ) {
    return getRoleDefaultTheme(isAdmin);
  }

  return selectedTheme;
}

export function UserSettingsProvider({
  children,
}) {
  const {
    user,
    isAdmin,
    profileLoading,
  } = useAuth();

  const [settings, setSettings] =
    useState(defaultSettings);

  const [
    settingsLoading,
    setSettingsLoading,
  ] = useState(true);

  const [settingsError, setSettingsError] =
    useState("");

  const [systemTheme, setSystemTheme] =
    useState(getSystemTheme);

  const roleDefaultTheme =
    getRoleDefaultTheme(isAdmin);

  const resolvedTheme = resolveTheme({
    selectedTheme: settings.theme,
    isAdmin,
    systemTheme,
  });

  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setSettings(defaultSettings);
      setSettingsLoading(false);
      setSettingsError("");
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsError("");

      const data = await fetchUserSettings(
        user.id,
      );

      setSettings({
        ...defaultSettings,
        ...(data ?? {}),
      });
    } catch (error) {
      console.error(
        "Failed to load user settings:",
        error,
      );

      setSettingsError(
        error?.message ||
          "Unable to load your settings.",
      );
    } finally {
      setSettingsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    function handleSystemThemeChange(event) {
      setSystemTheme(
        event.matches ? "dark" : "light",
      );
    }

    setSystemTheme(
      mediaQuery.matches ? "dark" : "light",
    );

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange,
      );
    };
  }, []);

  useEffect(() => {
    if (
      settingsLoading ||
      profileLoading
    ) {
      return;
    }

    document.documentElement.dataset.theme =
      resolvedTheme;

    document.documentElement.dataset.workspace =
      isAdmin ? "admin" : "personal";

    localStorage.setItem(
      "clearbudget-theme",
      resolvedTheme,
    );

    localStorage.setItem(
      "clearbudget-theme-preference",
      settings.theme || "role",
    );
  }, [
    resolvedTheme,
    settings.theme,
    settingsLoading,
    profileLoading,
    isAdmin,
  ]);

  async function updateSetting(key, value) {
    if (!user?.id) {
      throw new Error(
        "You must be signed in to update settings.",
      );
    }

    const previousSettings = settings;

    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));

    try {
      const updatedSettings =
        await saveUserSettings(user.id, {
          [key]: value,
        });

      const mergedSettings = {
        ...defaultSettings,
        ...updatedSettings,
      };

      setSettings(mergedSettings);

      return mergedSettings;
    } catch (error) {
      setSettings(previousSettings);
      throw error;
    }
  }

  async function updateSettings(updates) {
    if (!user?.id) {
      throw new Error(
        "You must be signed in to update settings.",
      );
    }

    const previousSettings = settings;

    setSettings((currentSettings) => ({
      ...currentSettings,
      ...updates,
    }));

    try {
      const updatedSettings =
        await saveUserSettings(
          user.id,
          updates,
        );

      const mergedSettings = {
        ...defaultSettings,
        ...updatedSettings,
      };

      setSettings(mergedSettings);

      return mergedSettings;
    } catch (error) {
      setSettings(previousSettings);
      throw error;
    }
  }

  const value = useMemo(
    () => ({
      settings,
      settingsLoading:
        settingsLoading || profileLoading,
      settingsError,

      multipleAccountsEnabled: Boolean(
        settings.multiple_accounts,
      ),
      aiCoachEnabled: Boolean(
  settings.ai_coach_enabled,
),

      selectedTheme:
        settings.theme || "role",

      resolvedTheme,
      roleDefaultTheme,
      workspace:
        isAdmin ? "admin" : "personal",

      updateSetting,
      updateSettings,
      refreshSettings: loadSettings,
    }),
    [
      settings,
      settingsLoading,
      profileLoading,
      settingsError,
      resolvedTheme,
      roleDefaultTheme,
      isAdmin,
      loadSettings,
    ],
  );

  return (
    <UserSettingsContext.Provider
      value={value}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(
    UserSettingsContext,
  );

  if (!context) {
    throw new Error(
      "useUserSettings must be used inside UserSettingsProvider.",
    );
  }

  return context;
}