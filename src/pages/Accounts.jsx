import { useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  archiveAccount,
  createAccount,
  deleteAccount,
  fetchAccounts,
  restoreAccount,
  updateAccount,
} from "../lib/accountsApi";
import { fetchTransactions } from "../lib/transactionsApi";

const defaultAccountForm = {
  name: "",
  accountType: "checking",
  startingBalance: "",
  color: "#2563eb",
};

const accountTypeLabels = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  cash: "Cash",
  investment: "Investment",
  loan: "Loan",
  other: "Other",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accountForm, setAccountForm] = useState(
    defaultAccountForm,
  );

  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [accountData, transactionData] = await Promise.all([
  fetchAccounts({
    includeArchived: true,
  }),
  fetchTransactions(),
]);

if (active) {
  setAccounts(accountData);
  setTransactions(transactionData);
}
      } catch (error) {
        console.error("Unable to load accounts:", error);

        if (active) {
          setErrorMessage(
            "Unable to load your accounts from Supabase.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAccounts();

    return () => {
      active = false;
    };
  }, []);
const accountsWithBalances = useMemo(() => {
  return accounts.map((account) => {
    const accountTransactions = transactions.filter(
      (transaction) =>
        transaction.accountId === account.id ||
        (!transaction.accountId &&
          transaction.account === account.name),
    );

    const transactionChange = accountTransactions.reduce(
      (total, transaction) => {
        const amount = Number(transaction.amount || 0);

        return transaction.type === "income"
          ? total + amount
          : total - amount;
      },
      0,
    );

    const currentBalance =
      Number(account.startingBalance || 0) +
      transactionChange;

    return {
      ...account,
      currentBalance,
    };
  });
}, [accounts, transactions]);
  const visibleAccounts = useMemo(() => {
    return accountsWithBalances
      .filter((account) =>
        showArchived
          ? account.isArchived
          : !account.isArchived,
      )
      .sort((firstAccount, secondAccount) =>
        firstAccount.name.localeCompare(secondAccount.name),
      );
  }, [accountsWithBalances, showArchived]);

  const totals = useMemo(() => {
    const activeAccounts = accountsWithBalances.filter(
      (account) => !account.isArchived,
    );

    const assets = activeAccounts
      .filter(
        (account) =>
          account.accountType !== "credit_card" &&
          account.accountType !== "loan",
      )
      .reduce(
        (total, account) =>
          total + Number(account.currentBalance || 0),
        0,
      );

    const liabilities = activeAccounts
      .filter(
        (account) =>
          account.accountType === "credit_card" ||
          account.accountType === "loan",
      )
      .reduce(
        (total, account) =>
          total + Math.abs(Number(account.currentBalance || 0)),
        0,
      );

    return {
      assets,
      liabilities,
      netWorth: assets - liabilities,
      activeCount: activeAccounts.length,
    };
  }, [accountsWithBalances]);

  function openAddModal() {
    setEditingId(null);
    setAccountForm(defaultAccountForm);
    setModalOpen(true);
  }

  function openEditModal(account) {
    setEditingId(account.id);

    setAccountForm({
      name: account.name,
      accountType: account.accountType,
      startingBalance: account.startingBalance.toString(),
      color: account.color || "#2563eb",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingId(null);
    setAccountForm(defaultAccountForm);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setAccountForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = accountForm.name.trim();
    const startingBalance = Number(
  accountForm.startingBalance || 0,
);

    if (!name) {
      alert("Please enter an account name.");
      return;
    }

    if (!Number.isFinite(startingBalance)) {
      alert("Please enter a valid account balance.");
      return;
    }

    const accountData = {
      name,
      accountType: accountForm.accountType,
      startingBalance,
      color: accountForm.color,
      isArchived: false,
    };

    try {
      setSaving(true);
      setErrorMessage("");

      if (editingId) {
        const currentAccount = accounts.find(
          (account) => account.id === editingId,
        );

        const savedAccount = await updateAccount(
          editingId,
          {
            ...accountData,
            isArchived:
              currentAccount?.isArchived ?? false,
          },
        );

        setAccounts((currentAccounts) =>
          currentAccounts.map((account) =>
            account.id === editingId
              ? savedAccount
              : account,
          ),
        );
      } else {
        const savedAccount =
          await createAccount(accountData);

        setAccounts((currentAccounts) => [
          ...currentAccounts,
          savedAccount,
        ]);
      }

      closeModal();
    } catch (error) {
      console.error("Unable to save account:", error);

      setErrorMessage(
        "The account could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(account) {
    const confirmed = window.confirm(
      `Archive ${account.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyId(account.id);

      const savedAccount = await archiveAccount(
        account.id,
      );

      setAccounts((currentAccounts) =>
        currentAccounts.map((currentAccount) =>
          currentAccount.id === savedAccount.id
            ? savedAccount
            : currentAccount,
        ),
      );
    } catch (error) {
      console.error("Unable to archive account:", error);

      alert("The account could not be archived.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(account) {
    try {
      setBusyId(account.id);

      const savedAccount = await restoreAccount(
        account.id,
      );

      setAccounts((currentAccounts) =>
        currentAccounts.map((currentAccount) =>
          currentAccount.id === savedAccount.id
            ? savedAccount
            : currentAccount,
        ),
      );
    } catch (error) {
      console.error("Unable to restore account:", error);

      alert("The account could not be restored.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(account) {
    const confirmed = window.confirm(
      `Permanently delete ${account.name}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyId(account.id);

      await deleteAccount(account.id);

      setAccounts((currentAccounts) =>
        currentAccounts.filter(
          (currentAccount) =>
            currentAccount.id !== account.id,
        ),
      );
    } catch (error) {
      console.error("Unable to delete account:", error);

      alert("The account could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            Financial accounts
          </p>

          <h1>Accounts</h1>

          <p className="page-description">
            Track checking, savings, credit cards,
            investments, cash, and loans.
          </p>
        </div>

        <button
          className="primary-button button-with-icon"
          type="button"
          onClick={openAddModal}
          disabled={loading}
        >
          <FiPlus />
          Add account
        </button>
      </div>

      <div className="goal-summary-grid">
        <section className="summary-card">
          <p>Net worth</p>
          <h2
            className={
              totals.netWorth >= 0
                ? "money-positive"
                : "money-negative"
            }
          >
            {formatCurrency(totals.netWorth)}
          </h2>
          <span>Assets minus liabilities</span>
        </section>

        <section className="summary-card">
          <p>Total assets</p>
          <h2 className="money-positive">
            {formatCurrency(totals.assets)}
          </h2>
          <span>Cash and owned accounts</span>
        </section>

        <section className="summary-card">
          <p>Total liabilities</p>
          <h2 className="money-negative">
            {formatCurrency(totals.liabilities)}
          </h2>
          <span>Credit cards and loans</span>
        </section>

        <section className="summary-card">
          <p>Active accounts</p>
          <h2>{totals.activeCount}</h2>
          <span>Currently included</span>
        </section>
      </div>

      {errorMessage && (
        <section className="content-card">
          <p>{errorMessage}</p>
        </section>
      )}

      <section className="content-card">
        <div className="goal-toolbar">
          <div>
            <p className="page-eyebrow">
              Account list
            </p>

            <h2>
              {showArchived
                ? "Archived accounts"
                : "Active accounts"}
            </h2>
          </div>

          <button
            className="secondary-button button-with-icon"
            type="button"
            onClick={() =>
              setShowArchived(
                (currentValue) => !currentValue,
              )
            }
          >
            <FiArchive />
            {showArchived
              ? "View active"
              : "View archived"}
          </button>
        </div>

        {loading ? (
          <div className="goal-empty-state">
            <FiRefreshCw />
            <strong>Loading accounts...</strong>
            <span>
              Retrieving your financial accounts.
            </span>
          </div>
        ) : visibleAccounts.length > 0 ? (
          <div className="goal-card-grid">
            {visibleAccounts.map((account) => (
              <article
                className="goal-card"
                key={account.id}
              >
                <div className="goal-card-heading">
                  <div className="goal-title-area">
                    <div
                      className="goal-icon"
                      style={{
                        backgroundColor: account.color,
                      }}
                    >
                      {account.accountType ===
                      "credit_card" ? (
                        <FiCreditCard />
                      ) : (
                        <FiDollarSign />
                      )}
                    </div>

                    <div>
                      <p>
                        {accountTypeLabels[
                          account.accountType
                        ] || "Account"}
                      </p>

                      <h3>{account.name}</h3>
                    </div>
                  </div>

                  <div className="goal-card-actions">
                    {!account.isArchived && (
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() =>
                          openEditModal(account)
                        }
                        disabled={busyId === account.id}
                        aria-label={`Edit ${account.name}`}
                      >
                        <FiEdit2 />
                      </button>
                    )}

                    {account.isArchived ? (
                      <>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() =>
                            handleRestore(account)
                          }
                          disabled={busyId === account.id}
                          aria-label={`Restore ${account.name}`}
                        >
                          <FiRefreshCw />
                        </button>

                        <button
                          className="icon-button delete-icon-button"
                          type="button"
                          onClick={() =>
                            handleDelete(account)
                          }
                          disabled={busyId === account.id}
                          aria-label={`Delete ${account.name}`}
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    ) : (
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() =>
                          handleArchive(account)
                        }
                        disabled={busyId === account.id}
                        aria-label={`Archive ${account.name}`}
                      >
                        <FiArchive />
                      </button>
                    )}
                  </div>
                </div>

                <div className="goal-amount-row">
                  <div>
                    <span>Current balance</span>

                    <strong
                      className={
                        account.currentBalance >= 0
                          ? "money-positive"
                          : "money-negative"
                      }
                    >
                      {formatCurrency(account.currentBalance)}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>
                      {account.isArchived
                        ? "Archived"
                        : "Active"}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="goal-empty-state">
            <FiDollarSign />
            <strong>
              {showArchived
                ? "No archived accounts"
                : "No accounts yet"}
            </strong>

            <span>
              {showArchived
                ? "Archived accounts will appear here."
                : "Add your first account to begin tracking balances."}
            </span>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeModal}
          role="presentation"
        >
          <div
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  Financial account
                </p>

                <h2 id="account-modal-title">
                  {editingId
                    ? "Edit account"
                    : "Add account"}
                </h2>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close account form"
              >
                <FiX />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleSubmit}
            >
              <div className="form-field form-field-full">
                <label htmlFor="account-name">
                  Account name
                </label>

                <input
                  id="account-name"
                  name="name"
                  type="text"
                  placeholder="Example: Main Checking"
                  value={accountForm.name}
                  onChange={handleInputChange}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="account-type">
                  Account type
                </label>

                <select
                  id="account-type"
                  name="accountType"
                  value={accountForm.accountType}
                  onChange={handleInputChange}
                >
                  <option value="checking">
                    Checking
                  </option>

                  <option value="savings">
                    Savings
                  </option>

                  <option value="credit_card">
                    Credit Card
                  </option>

                  <option value="cash">Cash</option>

                  <option value="investment">
                    Investment
                  </option>

                  <option value="loan">Loan</option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="account-balance">
  Starting balance
</label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="account-balance"
                    name="startingBalance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={accountForm.startingBalance}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="account-color">
                  Account color
                </label>

                <input
                  id="account-color"
                  name="color"
                  type="color"
                  value={accountForm.color}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions form-field-full">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Save account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accounts;