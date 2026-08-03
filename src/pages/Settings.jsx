import { useEffect, useState } from "react";
import {
  FiBell,
  FiCalendar,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiRefreshCw,
  FiSave,
  FiSettings,
} from "react-icons/fi";

import { useUserSettings } from "../context/UserSettingsContext";

import {
  defaultSettings,
  fetchSettings,
  saveSettings,
} from "../lib/settingsApi";

function Settings() {
  const {
    multipleAccountsEnabled,
    updateSetting,
    settingsLoading,
  } = useUserSettings();

  const [settings, setSettings] = useState(
    defaultSettings,
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const [accountsSaving, setAccountsSaving] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setErrorMessage("");

        const savedSettings = await fetchSettings();

        if (!active) {
          return;
        }

        setSettings(savedSettings);
        applyTheme(savedSettings.theme);
      } catch (error) {
        console.error(
          "Unable to load settings:",
          error,
        );

        if (active) {
          setErrorMessage(
            "Unable to load your settings.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    localStorage.setItem(
      "clearbudget-theme",
      theme,
    );
  }

  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

    const nextValue =
      type === "checkbox" ? checked : value;

    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: nextValue,
    }));

    if (name === "theme") {
      applyTheme(nextValue);
    }

    setMessage("");
    setErrorMessage("");
  }

  async function handleMultipleAccountsToggle() {
    try {
      setAccountsSaving(true);
      setMessage("");
      setErrorMessage("");

      const nextValue = !multipleAccountsEnabled;

      await updateSetting(
        "multiple_accounts",
        nextValue,
      );

      setMessage(
        nextValue
          ? "Multiple account tracking enabled."
          : "Multiple account tracking disabled.",
      );
    } catch (error) {
      console.error(
        "Unable to update multiple account tracking:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "Unable to update account tracking.",
      );
    } finally {
      setAccountsSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setErrorMessage("");

      const savedSettings =
        await saveSettings(settings);

      setSettings(savedSettings);
      applyTheme(savedSettings.theme);

      setMessage("Settings saved successfully.");
    } catch (error) {
      console.error(
        "Unable to save settings:",
        error,
      );

      setErrorMessage(
        "Your settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  function restoreDefaults() {
    const confirmed = window.confirm(
      "Restore all settings to their default values?",
    );

    if (!confirmed) {
      return;
    }

    setSettings({ ...defaultSettings });
    applyTheme(defaultSettings.theme);

    setMessage(
      "Defaults restored. Select Save settings to keep them.",
    );

    setErrorMessage("");
  }

  if (loading || settingsLoading) {
    return (
      <div className="page-content">
        <section className="content-card">
          <div className="goal-empty-state">
            <FiSettings />

            <strong>Loading settings...</strong>

            <span>
              Retrieving your preferences from
              Supabase.
            </span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            Application preferences
          </p>

          <h1>Settings</h1>

          <p className="page-description">
            Customize how ClearBudget displays and
            manages your financial information.
          </p>
        </div>
      </div>

      {message && (
        <section className="content-card">
          <p className="money-positive">
            <FiCheck /> {message}
          </p>
        </section>
      )}

      {errorMessage && (
        <section className="content-card">
          <p>{errorMessage}</p>
        </section>
      )}

      <form onSubmit={handleSubmit}>
        <section className="content-card">
          <div className="modal-header">
            <div>
              <p className="page-eyebrow">
                Display
              </p>

              <h2>Appearance and formatting</h2>
            </div>

            <FiDollarSign />
          </div>

          <div className="transaction-form">
            <div className="form-field">
              <label htmlFor="currency">
                Currency
              </label>

              <select
                id="currency"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
              >
                <option value="USD">
                  US Dollar (USD)
                </option>

                <option value="CAD">
                  Canadian Dollar (CAD)
                </option>

                <option value="EUR">
                  Euro (EUR)
                </option>

                <option value="GBP">
                  British Pound (GBP)
                </option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="theme">Theme</label>

              <select
                id="theme"
                name="theme"
                value={settings.theme}
                onChange={handleChange}
              >
                <option value="system">
                  Use device setting
                </option>

                <option value="light">
                  Light
                </option>

                <option value="dark">
                  Dark
                </option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="dashboardPeriod">
                Default dashboard period
              </label>

              <select
                id="dashboardPeriod"
                name="dashboardPeriod"
                value={settings.dashboardPeriod}
                onChange={handleChange}
              >
                <option value="week">
                  This week
                </option>

                <option value="month">
                  This month
                </option>

                <option value="quarter">
                  This quarter
                </option>

                <option value="year">
                  This year
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="content-card">
          <div className="modal-header">
            <div>
              <p className="page-eyebrow">
                Calendar
              </p>

              <h2>Budget preferences</h2>
            </div>

            <FiCalendar />
          </div>

          <div className="transaction-form">
            <div className="form-field">
              <label htmlFor="weekStartsOn">
                Week starts on
              </label>

              <select
                id="weekStartsOn"
                name="weekStartsOn"
                value={settings.weekStartsOn}
                onChange={handleChange}
              >
                <option value="sunday">
                  Sunday
                </option>

                <option value="monday">
                  Monday
                </option>
              </select>
            </div>

            <label className="form-field form-field-full">
              <span>
                <strong>
                  Monthly budget rollover
                </strong>
              </span>

              <span>
                Carry unused budget amounts into the
                following month.
              </span>

              <input
                name="budgetRolloverEnabled"
                type="checkbox"
                checked={
                  settings.budgetRolloverEnabled
                }
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="content-card">
          <div className="modal-header">
            <div>
              <p className="page-eyebrow">
                Notifications
              </p>

              <h2>Bill reminders</h2>
            </div>

            <FiBell />
          </div>

          <div className="transaction-form">
            <label className="form-field form-field-full">
              <span>
                <strong>
                  Enable bill reminders
                </strong>
              </span>

              <span>
                Show reminders for upcoming and overdue
                bills.
              </span>

              <input
                name="billRemindersEnabled"
                type="checkbox"
                checked={
                  settings.billRemindersEnabled
                }
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="content-card">
          <div className="modal-header">
            <div>
              <p className="page-eyebrow">
                Advanced features
              </p>

              <h2>Account tracking</h2>
            </div>

            <FiCreditCard />
          </div>

          <div className="transaction-form">
            <label className="form-field form-field-full">
              <span>
                <strong>Multiple accounts</strong>
              </span>

              <span>
                {multipleAccountsEnabled
                  ? "Account tracking is enabled. The Accounts page and account fields can be shown."
                  : "Account tracking is disabled. Income and expenses can be entered without selecting an account."}
              </span>

              <input
                type="checkbox"
                checked={multipleAccountsEnabled}
                onChange={
                  handleMultipleAccountsToggle
                }
                disabled={accountsSaving}
              />
            </label>
          </div>

          {accountsSaving && (
            <p className="page-description">
              Saving account preference...
            </p>
          )}
        </section>

        <div className="modal-actions">
          <button
            className="secondary-button button-with-icon"
            type="button"
            onClick={restoreDefaults}
            disabled={saving || accountsSaving}
          >
            <FiRefreshCw />
            Restore defaults
          </button>

          <button
            className="primary-button button-with-icon"
            type="submit"
            disabled={saving || accountsSaving}
          >
            <FiSave />

            {saving
              ? "Saving..."
              : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
