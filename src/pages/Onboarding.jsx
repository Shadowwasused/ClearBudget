import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiHome,
  FiTrendingUp,
} from "react-icons/fi";

import { createAccount } from "../lib/accountsApi";
import { createTransaction } from "../lib/transactionsApi";
import { createBill } from "../lib/billsApi";

import "./Onboarding.css";

const accountTypes = [
  {
    value: "checking",
    label: "Checking",
  },
  {
    value: "savings",
    label: "Savings",
  },
  {
    value: "credit_card",
    label: "Credit Card",
  },
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "investment",
    label: "Investment",
  },
  {
    value: "loan",
    label: "Loan",
  },
  {
    value: "other",
    label: "Other",
  },
];

const payFrequencies = [
  {
    value: "weekly",
    label: "Weekly",
    description: "Usually 52 paychecks each year",
  },
  {
    value: "biweekly",
    label: "Every two weeks",
    description: "Usually 26 paychecks each year",
  },
  {
    value: "twice_monthly",
    label: "Twice monthly",
    description: "Usually 24 paychecks each year",
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Usually 12 paychecks each year",
  },
];

const billCategories = [
  "Housing",
  "Utilities",
  "Insurance",
  "Phone",
  "Internet",
  "Transportation",
  "Subscription",
  "Debt",
  "Other",
];

const billFrequencies = [
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "biweekly",
    label: "Every two weeks",
  },
  {
    value: "yearly",
    label: "Yearly",
  },
  {
    value: "one_time",
    label: "One time",
  },
];

const totalSteps = 5;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [accountForm, setAccountForm] = useState({
    name: "Main Checking",
    accountType: "checking",
    startingBalance: "",
    color: "#2563eb",
  });

  const [incomeForm, setIncomeForm] = useState({
    description: "Paycheck",
    amount: "",
    frequency: "biweekly",
    date: getToday(),
  });

  const [includeBill, setIncludeBill] = useState(false);

  const [billForm, setBillForm] = useState({
    name: "",
    amount: "",
    dueDate: getToday(),
    category: "Housing",
    frequency: "monthly",
    autopay: false,
    notes: "",
  });

  const progressPercent = useMemo(
    () => (step / totalSteps) * 100,
    [step],
  );

  function changeAccount(event) {
    const { name, value } = event.target;

    setAccountForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function changeIncome(event) {
    const { name, value } = event.target;

    setIncomeForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function changeBill(event) {
    const { name, value, type, checked } = event.target;

    setBillForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function validateCurrentStep() {
    setErrorMessage("");

    if (step === 2) {
      const startingBalance = Number(
        accountForm.startingBalance || 0,
      );

      if (!accountForm.name.trim()) {
        setErrorMessage(
          "Please enter a name for your first account.",
        );

        return false;
      }

      if (!Number.isFinite(startingBalance)) {
        setErrorMessage(
          "Please enter a valid starting balance.",
        );

        return false;
      }
    }

    if (step === 3) {
      const incomeAmount = Number(incomeForm.amount || 0);

      if (!incomeForm.description.trim()) {
        setErrorMessage(
          "Please enter a name for your income.",
        );

        return false;
      }

      if (
        !Number.isFinite(incomeAmount) ||
        incomeAmount <= 0
      ) {
        setErrorMessage(
          "Please enter an income amount greater than zero.",
        );

        return false;
      }

      if (!incomeForm.date) {
        setErrorMessage(
          "Please select the date of your income.",
        );

        return false;
      }
    }

    if (step === 4 && includeBill) {
      const billAmount = Number(billForm.amount || 0);

      if (!billForm.name.trim()) {
        setErrorMessage(
          "Please enter the name of your bill.",
        );

        return false;
      }

      if (
        !Number.isFinite(billAmount) ||
        billAmount <= 0
      ) {
        setErrorMessage(
          "Please enter a bill amount greater than zero.",
        );

        return false;
      }

      if (!billForm.dueDate) {
        setErrorMessage(
          "Please select a due date for your bill.",
        );

        return false;
      }
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) =>
      Math.min(current + 1, totalSteps),
    );
  }

  function goBack() {
    setErrorMessage("");

    setStep((current) => Math.max(current - 1, 1));
  }

  async function completeOnboarding() {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const savedAccount = await createAccount({
        name: accountForm.name.trim(),
        accountType: accountForm.accountType,
        startingBalance: Number(
          accountForm.startingBalance || 0,
        ),
        color: accountForm.color,
        isArchived: false,
      });

      await createTransaction({
        description: incomeForm.description.trim(),
        amount: Number(incomeForm.amount || 0),
        type: "income",
        category: "Income",
        accountId: savedAccount.id,
        account: savedAccount.name,
        date: incomeForm.date,
        notes: `Initial income added during onboarding. Pay frequency: ${incomeForm.frequency}.`,
      });

      if (includeBill) {
        await createBill({
          name: billForm.name.trim(),
          amount: Number(billForm.amount || 0),
          dueDate: billForm.dueDate,
          category: billForm.category,
          frequency: billForm.frequency,
          autopay: billForm.autopay,
          paid: false,
          notes: billForm.notes.trim() || null,
        });
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Unable to complete onboarding:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "ClearBudget could not finish your setup. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-background-shape onboarding-shape-one" />
      <div className="onboarding-background-shape onboarding-shape-two" />

      <section className="onboarding-shell">
        <header className="onboarding-header">
          <button
            className="onboarding-brand"
            type="button"
            onClick={() => navigate("/")}
          >
            <span className="onboarding-brand-icon">
              C
            </span>

            <span>ClearBudget</span>
          </button>

          <div className="onboarding-step-label">
            Step {step} of {totalSteps}
          </div>
        </header>

        <div
          className="onboarding-progress"
          aria-label={`Step ${step} of ${totalSteps}`}
        >
          <div
            className="onboarding-progress-bar"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>

        <div className="onboarding-card">
          {step === 1 && (
            <section className="onboarding-step onboarding-welcome-step">
              <div className="onboarding-large-icon">
                <FiTrendingUp />
              </div>

              <p className="onboarding-eyebrow">
                Let&apos;s get you started
              </p>

              <h1>Build your first budget in minutes.</h1>

              <p className="onboarding-intro">
                We&apos;ll help you add your first
                financial account, income, and optional
                bill so your dashboard is useful from the
                moment you open it.
              </p>

              <div className="onboarding-feature-list">
                <div>
                  <FiCreditCard />

                  <span>
                    Add your primary financial account
                  </span>
                </div>

                <div>
                  <FiDollarSign />

                  <span>
                    Record your regular paycheck or income
                  </span>
                </div>

                <div>
                  <FiHome />

                  <span>
                    Add one recurring bill, or skip it
                  </span>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="onboarding-step">
              <div className="onboarding-step-heading">
                <div className="onboarding-small-icon">
                  <FiCreditCard />
                </div>

                <div>
                  <p className="onboarding-eyebrow">
                    Your first account
                  </p>

                  <h1>Where do you keep your money?</h1>

                  <p>
                    Start with the account you use most
                    often. You can add additional accounts
                    later.
                  </p>
                </div>
              </div>

              <div className="onboarding-form-grid">
                <div className="onboarding-field onboarding-field-full">
                  <label htmlFor="onboarding-account-name">
                    Account name
                  </label>

                  <input
                    id="onboarding-account-name"
                    name="name"
                    type="text"
                    placeholder="Example: Main Checking"
                    value={accountForm.name}
                    onChange={changeAccount}
                    autoFocus
                  />
                </div>

                <div className="onboarding-field">
                  <label htmlFor="onboarding-account-type">
                    Account type
                  </label>

                  <select
                    id="onboarding-account-type"
                    name="accountType"
                    value={accountForm.accountType}
                    onChange={changeAccount}
                  >
                    {accountTypes.map((accountType) => (
                      <option
                        key={accountType.value}
                        value={accountType.value}
                      >
                        {accountType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="onboarding-field">
                  <label htmlFor="onboarding-balance">
                    Current balance
                  </label>

                  <div className="onboarding-currency-input">
                    <span>$</span>

                    <input
                      id="onboarding-balance"
                      name="startingBalance"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={accountForm.startingBalance}
                      onChange={changeAccount}
                    />
                  </div>
                </div>

                <div className="onboarding-field onboarding-color-field">
                  <label htmlFor="onboarding-account-color">
                    Account color
                  </label>

                  <div className="onboarding-color-control">
                    <input
                      id="onboarding-account-color"
                      name="color"
                      type="color"
                      value={accountForm.color}
                      onChange={changeAccount}
                    />

                    <span>
                      Used to identify this account
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="onboarding-step">
              <div className="onboarding-step-heading">
                <div className="onboarding-small-icon">
                  <FiDollarSign />
                </div>

                <div>
                  <p className="onboarding-eyebrow">
                    Your income
                  </p>

                  <h1>Add your first paycheck.</h1>

                  <p>
                    This gives ClearBudget a starting point
                    for calculating monthly income and cash
                    flow.
                  </p>
                </div>
              </div>

              <div className="onboarding-form-grid">
                <div className="onboarding-field">
                  <label htmlFor="onboarding-income-name">
                    Income name
                  </label>

                  <input
                    id="onboarding-income-name"
                    name="description"
                    type="text"
                    placeholder="Example: Paycheck"
                    value={incomeForm.description}
                    onChange={changeIncome}
                  />
                </div>

                <div className="onboarding-field">
                  <label htmlFor="onboarding-income-amount">
                    Paycheck amount
                  </label>

                  <div className="onboarding-currency-input">
                    <span>$</span>

                    <input
                      id="onboarding-income-amount"
                      name="amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={incomeForm.amount}
                      onChange={changeIncome}
                    />
                  </div>
                </div>

                <div className="onboarding-field onboarding-field-full">
                  <label>How often are you paid?</label>

                  <div className="onboarding-choice-grid">
                    {payFrequencies.map((frequency) => (
                      <button
                        className={
                          incomeForm.frequency ===
                          frequency.value
                            ? "onboarding-choice onboarding-choice-selected"
                            : "onboarding-choice"
                        }
                        type="button"
                        key={frequency.value}
                        onClick={() =>
                          setIncomeForm((current) => ({
                            ...current,
                            frequency: frequency.value,
                          }))
                        }
                      >
                        <strong>{frequency.label}</strong>

                        <span>
                          {frequency.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="onboarding-field">
                  <label htmlFor="onboarding-income-date">
                    Most recent pay date
                  </label>

                  <input
                    id="onboarding-income-date"
                    name="date"
                    type="date"
                    value={incomeForm.date}
                    onChange={changeIncome}
                  />
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="onboarding-step">
              <div className="onboarding-step-heading">
                <div className="onboarding-small-icon">
                  <FiHome />
                </div>

                <div>
                  <p className="onboarding-eyebrow">
                    Optional first bill
                  </p>

                  <h1>Add an upcoming bill.</h1>

                  <p>
                    Adding a bill helps your dashboard
                    immediately show upcoming obligations.
                    You can skip this step.
                  </p>
                </div>
              </div>

              <div className="onboarding-bill-toggle">
                <button
                  className={
                    includeBill
                      ? "onboarding-toggle-card onboarding-toggle-card-selected"
                      : "onboarding-toggle-card"
                  }
                  type="button"
                  onClick={() => setIncludeBill(true)}
                >
                  <span className="onboarding-toggle-check">
                    {includeBill && <FiCheck />}
                  </span>

                  <div>
                    <strong>Add a bill</strong>

                    <span>
                      Enter one upcoming expense now
                    </span>
                  </div>
                </button>

                <button
                  className={
                    !includeBill
                      ? "onboarding-toggle-card onboarding-toggle-card-selected"
                      : "onboarding-toggle-card"
                  }
                  type="button"
                  onClick={() => setIncludeBill(false)}
                >
                  <span className="onboarding-toggle-check">
                    {!includeBill && <FiCheck />}
                  </span>

                  <div>
                    <strong>Skip for now</strong>

                    <span>
                      Add bills later from the Bills page
                    </span>
                  </div>
                </button>
              </div>

              {includeBill && (
                <div className="onboarding-form-grid onboarding-bill-form">
                  <div className="onboarding-field">
                    <label htmlFor="onboarding-bill-name">
                      Bill name
                    </label>

                    <input
                      id="onboarding-bill-name"
                      name="name"
                      type="text"
                      placeholder="Example: Rent"
                      value={billForm.name}
                      onChange={changeBill}
                    />
                  </div>

                  <div className="onboarding-field">
                    <label htmlFor="onboarding-bill-amount">
                      Amount
                    </label>

                    <div className="onboarding-currency-input">
                      <span>$</span>

                      <input
                        id="onboarding-bill-amount"
                        name="amount"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={billForm.amount}
                        onChange={changeBill}
                      />
                    </div>
                  </div>

                  <div className="onboarding-field">
                    <label htmlFor="onboarding-bill-date">
                      Next due date
                    </label>

                    <input
                      id="onboarding-bill-date"
                      name="dueDate"
                      type="date"
                      value={billForm.dueDate}
                      onChange={changeBill}
                    />
                  </div>

                  <div className="onboarding-field">
                    <label htmlFor="onboarding-bill-category">
                      Category
                    </label>

                    <select
                      id="onboarding-bill-category"
                      name="category"
                      value={billForm.category}
                      onChange={changeBill}
                    >
                      {billCategories.map((category) => (
                        <option
                          value={category}
                          key={category}
                        >
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="onboarding-field">
                    <label htmlFor="onboarding-bill-frequency">
                      Frequency
                    </label>

                    <select
                      id="onboarding-bill-frequency"
                      name="frequency"
                      value={billForm.frequency}
                      onChange={changeBill}
                    >
                      {billFrequencies.map((frequency) => (
                        <option
                          value={frequency.value}
                          key={frequency.value}
                        >
                          {frequency.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="onboarding-checkbox">
                    <input
                      name="autopay"
                      type="checkbox"
                      checked={billForm.autopay}
                      onChange={changeBill}
                    />

                    <span>
                      This bill is paid automatically
                    </span>
                  </label>

                  <div className="onboarding-field onboarding-field-full">
                    <label htmlFor="onboarding-bill-notes">
                      Notes
                    </label>

                    <textarea
                      id="onboarding-bill-notes"
                      name="notes"
                      rows="3"
                      placeholder="Optional notes"
                      value={billForm.notes}
                      onChange={changeBill}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 5 && (
            <section className="onboarding-step onboarding-review-step">
              <div className="onboarding-large-icon onboarding-success-icon">
                <FiCheck />
              </div>

              <p className="onboarding-eyebrow">
                Ready to begin
              </p>

              <h1>Your ClearBudget setup is ready.</h1>

              <p className="onboarding-intro">
                Review the information below. ClearBudget
                will save everything when you open your
                dashboard.
              </p>

              <div className="onboarding-review-grid">
                <article>
                  <span>First account</span>

                  <strong>{accountForm.name}</strong>

                  <p>
                    {formatCurrency(
                      accountForm.startingBalance,
                    )}{" "}
                    starting balance
                  </p>
                </article>

                <article>
                  <span>Income</span>

                  <strong>
                    {incomeForm.description}
                  </strong>

                  <p>
                    {formatCurrency(incomeForm.amount)} per
                    paycheck
                  </p>
                </article>

                <article>
                  <span>First bill</span>

                  <strong>
                    {includeBill
                      ? billForm.name
                      : "Skipped"}
                  </strong>

                  <p>
                    {includeBill
                      ? `${formatCurrency(
                          billForm.amount,
                        )} due ${billForm.dueDate}`
                      : "You can add bills later"}
                  </p>
                </article>
              </div>

              <div className="onboarding-save-notice">
                <FiCheck />

                <span>
                  Your information will be saved securely to
                  your ClearBudget account.
                </span>
              </div>
            </section>
          )}

          {errorMessage && (
            <div
              className="onboarding-error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <footer className="onboarding-actions">
            {step > 1 ? (
              <button
                className="onboarding-back-button"
                type="button"
                onClick={goBack}
                disabled={saving}
              >
                <FiArrowLeft />
                Back
              </button>
            ) : (
              <span />
            )}

            {step < totalSteps ? (
              <button
                className="onboarding-primary-button"
                type="button"
                onClick={goNext}
              >
                Continue
                <FiArrowRight />
              </button>
            ) : (
              <button
                className="onboarding-primary-button"
                type="button"
                onClick={completeOnboarding}
                disabled={saving}
              >
                {saving
                  ? "Setting up your account..."
                  : "Open my dashboard"}

                {!saving && <FiArrowRight />}
              </button>
            )}
          </footer>
        </div>
      </section>
    </main>
  );
}

export default Onboarding;