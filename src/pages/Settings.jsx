import { useState } from "react";
import {
  FiBell,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiMonitor,
  FiRefreshCw,
  FiSettings,
} from "react-icons/fi";

import { useUserSettings } from "../context/UserSettingsContext";

function Settings() {
  const {
    settings,
    settingsLoading,
    settingsError,
    selectedTheme,
    resolvedTheme,
    roleDefaultTheme,
    workspace,
    multipleAccountsEnabled,
    updateSetting,
    refreshSettings,
  } = useUserSettings();

  const [savingField, setSavingField] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function saveSetting(
    key,
    value,
    successMessage,
  ) {
    try {
      setSavingField(key);
      setMessage("");
      setErrorMessage("");

      await updateSetting(key, value);

      setMessage(
        successMessage ||
          "Setting updated successfully.",
      );
    } catch (error) {
      console.error(
        `Unable to update ${key}:`,
        error,
      );

      setErrorMessage(
        error?.message ||
          "Your setting could not be updated.",
      );
    } finally {
      setSavingField("");
    }
  }

  function handleSelectChange(event) {
    const { name, value } = event.target;

    const messages = {
      currency: "Currency updated.",
      theme: "Workspace appearance updated.",
      dashboard_period:
        "Dashboard period updated.",
    };

    saveSetting(
      name,
      value,
      messages[name],
    );
  }

  function handleCheckboxChange(event) {
    const { name, checked } = event.target;

    const messages = {
      budget_rollover_enabled: checked
        ? "Monthly budget rollover enabled."
        : "Monthly budget rollover disabled.",

      bill_reminders_enabled: checked
        ? "Bill reminders enabled."
        : "Bill reminders disabled.",

      multiple_accounts: checked
        ? "Multiple account tracking enabled."
        : "Multiple account tracking disabled.",
    };

    saveSetting(
      name,
      checked,
      messages[name],
    );
  }

  async function handleRefresh() {
    try {
      setSavingField("refresh");
      setMessage("");
      setErrorMessage("");

      await refreshSettings();

      setMessage(
        "Settings refreshed from Supabase.",
      );
    } catch (error) {
      console.error(
        "Unable to refresh settings:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "Settings could not be refreshed.",
      );
    } finally {
      setSavingField("");
    }
  }

  if (settingsLoading) {
    return (
      <div className="page-content">
        <section className="content-card">
          <div className="goal-empty-state">
            <FiSettings />

            <strong>
              Loading settings...
            </strong>

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
            Customize your ClearBudget workspace,
            financial preferences, and optional
            features.
          </p>
        </div>

        <button
          className="secondary-button button-with-icon"
          type="button"
          onClick={handleRefresh}
          disabled={Boolean(savingField)}
        >
          <FiRefreshCw />

          {savingField === "refresh"
            ? "Refreshing..."
            : "Refresh settings"}
        </button>
      </div>

      {message && (
        <section className="content-card">
          <p className="money-positive">
            <FiCheck /> {message}
          </p>
        </section>
      )}

      {(errorMessage || settingsError) && (
        <section className="content-card">
          <p className="money-negative">
            {errorMessage || settingsError}
          </p>
        </section>
      )}

      <section className="content-card">
        <div className="modal-header">
          <div>
            <p className="page-eyebrow">
              Workspace
            </p>

            <h2>
              Appearance and role experience
            </h2>
          </div>

          <FiMonitor />
        </div>

        <div className="transaction-form">
          <div className="form-field">
            <label htmlFor="theme">
              Workspace appearance
            </label>

            <select
              id="theme"
              name="theme"
              value={selectedTheme}
              onChange={handleSelectChange}
              disabled={Boolean(savingField)}
            >
              <option value="role">
                Use role default
              </option>

              <option value="system">
                Use device setting
              </option>

              <option value="midnight">
                Midnight Blue
              </option>

              <option value="graphite">
                Graphite
              </option>

              <option value="light">
                Light
              </option>

              <option value="dark">
                Dark
              </option>
            </select>

            <span className="settings-field-help">
              Role default currently uses{" "}
              <strong>
                {roleDefaultTheme}
              </strong>{" "}
              for your {workspace} workspace.
            </span>
          </div>

          <div className="form-field">
            <label>
              Active workspace
            </label>

            <div className="settings-readonly-value">
              <strong>
                {workspace === "admin"
                  ? "Administrator"
                  : "Personal"}
              </strong>

              <span>
                Active theme: {resolvedTheme}
              </span>
            </div>
          </div>
        </div>

        {savingField === "theme" && (
          <p className="page-description">
            Applying workspace appearance...
          </p>
        )}
      </section>

      <section className="content-card">
        <div className="modal-header">
          <div>
            <p className="page-eyebrow">
              Display
            </p>

            <h2>
              Currency and dashboard
            </h2>
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
              value={settings.currency || "USD"}
              onChange={handleSelectChange}
              disabled={Boolean(savingField)}
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
            <label htmlFor="dashboard_period">
              Default dashboard period
            </label>

            <select
              id="dashboard_period"
              name="dashboard_period"
              value={
                settings.dashboard_period ||
                "month"
              }
              onChange={handleSelectChange}
              disabled={Boolean(savingField)}
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
              Budgeting
            </p>

            <h2>
              Budget preferences
            </h2>
          </div>

          <FiDollarSign />
        </div>

        <div className="transaction-form">
          <label className="form-field form-field-full settings-toggle-row">
            <span>
              <strong>
                Monthly budget rollover
              </strong>

              <small>
                Carry unused budget amounts into
                the following month.
              </small>
            </span>

            <input
              name="budget_rollover_enabled"
              type="checkbox"
              checked={Boolean(
                settings.budget_rollover_enabled,
              )}
              onChange={handleCheckboxChange}
              disabled={Boolean(savingField)}
            />
          </label>
        </div>

        {savingField ===
          "budget_rollover_enabled" && (
          <p className="page-description">
            Saving rollover preference...
          </p>
        )}
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
          <label className="form-field form-field-full settings-toggle-row">
            <span>
              <strong>
                Enable bill reminders
              </strong>

              <small>
                Show reminders for upcoming and
                overdue bills.
              </small>
            </span>

            <input
              name="bill_reminders_enabled"
              type="checkbox"
              checked={Boolean(
                settings.bill_reminders_enabled,
              )}
              onChange={handleCheckboxChange}
              disabled={Boolean(savingField)}
            />
          </label>
        </div>

        {savingField ===
          "bill_reminders_enabled" && (
          <p className="page-description">
            Saving reminder preference...
          </p>
        )}
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
          <label className="form-field form-field-full settings-toggle-row">
            <span>
              <strong>
                Multiple accounts
              </strong>

              <small>
                {multipleAccountsEnabled
                  ? "Account tracking is enabled. Account pages and transaction account fields are available."
                  : "Account tracking is disabled. Income and expenses can be entered without choosing an account."}
              </small>
            </span>

            <input
              name="multiple_accounts"
              type="checkbox"
              checked={
                multipleAccountsEnabled
              }
              onChange={handleCheckboxChange}
              disabled={Boolean(savingField)}
            />
          </label>
        </div>

        {savingField ===
          "multiple_accounts" && (
          <p className="page-description">
            Saving account preference...
          </p>
        )}
      </section>
    </div>
  );
}

export default Settings;