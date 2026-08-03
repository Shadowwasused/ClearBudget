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
  theme: "system",
  budget_rollover_enabled: false,
  bill_reminders_enabled: false,
  dashboard_period: "month",
  multiple_accounts: false,
};

export function UserSettingsProvider({ children }) {
  const { user } = useAuth();

  const [settings, setSettings] = useState(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");

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

      const data = await fetchUserSettings(user.id);

      setSettings({
        ...defaultSettings,
        ...(data ?? {}),
      });
    } catch (error) {
      console.error("Failed to load user settings:", error);
      setSettingsError(
        error?.message || "Unable to load your settings."
      );
    } finally {
      setSettingsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function updateSetting(key, value) {
    if (!user?.id) {
      throw new Error("You must be signed in to update settings.");
    }

    const previousSettings = settings;

    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    try {
      const updatedSettings = await saveUserSettings(user.id, {
        [key]: value,
      });

      setSettings({
        ...defaultSettings,
        ...updatedSettings,
      });

      return updatedSettings;
    } catch (error) {
      setSettings(previousSettings);
      throw error;
    }
  }

  async function updateSettings(updates) {
    if (!user?.id) {
      throw new Error("You must be signed in to update settings.");
    }

    const previousSettings = settings;

    setSettings((current) => ({
      ...current,
      ...updates,
    }));

    try {
      const updatedSettings = await saveUserSettings(user.id, updates);

      setSettings({
        ...defaultSettings,
        ...updatedSettings,
      });

      return updatedSettings;
    } catch (error) {
      setSettings(previousSettings);
      throw error;
    }
  }

  const value = useMemo(
    () => ({
      settings,
      settingsLoading,
      settingsError,
      multipleAccountsEnabled: Boolean(settings.multiple_accounts),
      updateSetting,
      updateSettings,
      refreshSettings: loadSettings,
    }),
    [settings, settingsLoading, settingsError, loadSettings]
  );

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);

  if (!context) {
    throw new Error(
      "useUserSettings must be used inside UserSettingsProvider."
    );
  }

  return context;
}