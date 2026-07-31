import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  billFrequencies,
  calculateBillTotals,
  formatBillCurrency,
  formatBillDate,
  getBillStatus,
  saveBills,
} from "../lib/bills";

import { categories } from "../lib/transactions";

import {
  createBill,
  deleteBill as deleteBillFromSupabase,
  fetchBills,
  toggleBillPaid,
  updateBill,
} from "../lib/billsApi";

const createDefaultForm = () => ({
  name: "",
  amount: "",
  dueDate: new Date().toISOString().slice(0, 10),
  category: "Utilities",
  frequency: "Monthly",
  autopay: false,
  paid: false,
  notes: "",
});

function Bills() {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState(createDefaultForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadBillsFromSupabase();
  }, []);

  useEffect(() => {
    if (!loading) {
      saveBills(bills);
    }
  }, [bills, loading]);

  async function loadBillsFromSupabase() {
    setLoading(true);
    setLoadError("");

    try {
      const loadedBills = await fetchBills();
      setBills(loadedBills);
      saveBills(loadedBills);
    } catch (error) {
      console.error("Unable to load bills:", error);
      setLoadError(
        "Bills could not be loaded. Check your Supabase connection.",
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredBills = useMemo(() => {
    return [...bills]
      .filter((bill) => {
        const searchText = search.trim().toLowerCase();

        const matchesSearch =
          bill.name.toLowerCase().includes(searchText) ||
          bill.category.toLowerCase().includes(searchText);

        const status = getBillStatus(bill);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "paid" && bill.paid) ||
          (statusFilter === "unpaid" && !bill.paid) ||
          (statusFilter === "overdue" &&
            status.label === "Overdue");

        const matchesFrequency =
          frequencyFilter === "all" ||
          bill.frequency === frequencyFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesFrequency
        );
      })
      .sort(
        (firstBill, secondBill) =>
          new Date(firstBill.dueDate) -
          new Date(secondBill.dueDate),
      );
  }, [bills, search, statusFilter, frequencyFilter]);

  const totals = useMemo(
    () => calculateBillTotals(bills),
    [bills],
  );

  function openAddModal() {
    setEditingId(null);
    setForm(createDefaultForm());
    setModalOpen(true);
  }

  function openEditModal(bill) {
    setEditingId(bill.id);

    setForm({
      name: bill.name,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate,
      category: bill.category,
      frequency: bill.frequency,
      autopay: Boolean(bill.autopay),
      paid: Boolean(bill.paid),
      notes: bill.notes || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingId(null);
    setForm(createDefaultForm());
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanedName = form.name.trim();
    const numericAmount = Number(form.amount);

    if (!cleanedName) {
      alert("Please enter a bill name.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Please enter an amount greater than $0.");
      return;
    }

    if (!form.dueDate) {
      alert("Please select a due date.");
      return;
    }

    const billData = {
      name: cleanedName,
      amount: numericAmount,
      dueDate: form.dueDate,
      category: form.category,
      frequency: form.frequency,
      autopay: Boolean(form.autopay),
      paid: Boolean(form.paid),
      notes: form.notes.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        const savedBill = await updateBill(
          editingId,
          billData,
        );

        setBills((currentBills) =>
          currentBills.map((bill) =>
            bill.id === editingId ? savedBill : bill,
          ),
        );
      } else {
        const savedBill = await createBill(billData);

        setBills((currentBills) => [
          ...currentBills,
          savedBill,
        ]);
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(createDefaultForm());
    } catch (error) {
      console.error("Unable to save bill:", error);
      alert(
        editingId
          ? "The bill could not be updated."
          : "The bill could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBill(id) {
    const bill = bills.find((item) => item.id === id);

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        bill?.name || "this bill"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBillFromSupabase(id);

      setBills((currentBills) =>
        currentBills.filter(
          (currentBill) => currentBill.id !== id,
        ),
      );
    } catch (error) {
      console.error("Unable to delete bill:", error);
      alert("The bill could not be deleted.");
    }
  }

  async function handleTogglePaid(id) {
    const bill = bills.find((item) => item.id === id);

    if (!bill) {
      return;
    }

    const newPaidStatus = !bill.paid;

    try {
      const updatedBill = await toggleBillPaid(
        id,
        newPaidStatus,
      );

      setBills((currentBills) =>
        currentBills.map((currentBill) =>
          currentBill.id === id
            ? updatedBill
            : currentBill,
        ),
      );
    } catch (error) {
      console.error(
        "Unable to update bill payment status:",
        error,
      );
      alert("The payment status could not be updated.");
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setFrequencyFilter("all");
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">Payment schedule</p>

          <h1>Bills</h1>

          <p className="page-description">
            Track due dates, recurring payments, autopay, and payment
            status.
          </p>
        </div>

        <div
  className="no-print"
  style={{ display: "flex", gap: "12px" }}
>
  <button
    className="secondary-button"
    type="button"
    onClick={() => window.print()}
  >
    Print Summary
  </button>

  <button
    className="primary-button button-with-icon"
    type="button"
    onClick={openAddModal}
  >
    <FiPlus />
    Add bill
  </button>
</div>
      </div>
<section className="bills-print-summary print-only">
  <div className="print-header">
    <h1>ClearBudget Bills Summary</h1>

    <p>
      Printed:{" "}
      {new Date().toLocaleDateString("en-US")}
    </p>
  </div>

  <div className="print-summary-totals">
    <div>
      <span>Total Bills</span>
      <strong>{bills.length}</strong>
    </div>

    <div>
      <span>Total Due</span>
      <strong>
        {formatBillCurrency(totals.unpaidAmount)}
      </strong>
    </div>

    <div>
      <span>Total Paid</span>
      <strong>
        {formatBillCurrency(totals.paidAmount)}
      </strong>
    </div>

    <div>
      <span>Overdue</span>
      <strong>{totals.overdueCount}</strong>
    </div>
  </div>

  <table className="print-accounts-table">
    <thead>
      <tr>
        <th>Bill</th>
        <th>Category</th>
        <th>Due</th>
        <th>Frequency</th>
        <th>Status</th>
        <th>Amount</th>
      </tr>
    </thead>

    <tbody>
      {filteredBills.map((bill) => {
        const status = getBillStatus(bill);

        return (
          <tr key={bill.id}>
            <td>{bill.name}</td>
            <td>{bill.category}</td>
            <td>{formatBillDate(bill.dueDate)}</td>
            <td>{bill.frequency}</td>
            <td>{status.label}</td>
            <td>{formatBillCurrency(bill.amount)}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
</section>
      <div className="bill-summary-grid">
        <section className="summary-card">
          <p>Amount due</p>

          <h2 className="money-negative">
            {formatBillCurrency(totals.unpaidAmount)}
          </h2>

          <span>{totals.unpaidCount} unpaid bills</span>
        </section>

        <section className="summary-card">
          <p>Paid</p>

          <h2 className="money-positive">
            {formatBillCurrency(totals.paidAmount)}
          </h2>

          <span>{totals.paidCount} paid bills</span>
        </section>

        <section className="summary-card">
          <p>Overdue</p>

          <h2
            className={
              totals.overdueCount > 0
                ? "money-negative"
                : "money-positive"
            }
          >
            {totals.overdueCount}
          </h2>

          <span>
            {totals.overdueCount === 0
              ? "Nothing overdue"
              : "Needs attention"}
          </span>
        </section>
      </div>

      <section className="content-card">
        <div className="bill-toolbar">
          <div className="transaction-search">
            <FiSearch />

            <input
              type="search"
              placeholder="Search bills..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={frequencyFilter}
            onChange={(event) =>
              setFrequencyFilter(event.target.value)
            }
          >
            <option value="all">All frequencies</option>

            {billFrequencies.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>

          <button
            className="secondary-button"
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        {loadError && (
          <div className="table-empty-state">
            <p>{loadError}</p>

            <button
              className="secondary-button"
              type="button"
              onClick={loadBillsFromSupabase}
            >
              Try again
            </button>
          </div>
        )}

        {!loadError && (
          <div className="bill-table-wrapper">
            <table className="bill-table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Due date</th>
                  <th>Category</th>
                  <th>Frequency</th>
                  <th>Autopay</th>
                  <th>Status</th>
                  <th className="table-amount-heading">
                    Amount
                  </th>
                  <th className="table-actions-heading">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="table-empty-state"
                      colSpan="8"
                    >
                      Loading bills...
                    </td>
                  </tr>
                ) : filteredBills.length > 0 ? (
                  filteredBills.map((bill) => {
                    const status = getBillStatus(bill);

                    return (
                      <tr key={bill.id}>
                        <td>
                          <div className="bill-name-cell">
                            <div className="bill-list-icon">
                              <FiCalendar />
                            </div>

                            <div>
                              <strong>{bill.name}</strong>

                              {bill.notes && (
                                <span>{bill.notes}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          {formatBillDate(bill.dueDate)}
                        </td>

                        <td>
                          <span className="category-pill">
                            {bill.category}
                          </span>
                        </td>

                        <td>{bill.frequency}</td>

                        <td>
                          <span
                            className={
                              bill.autopay
                                ? "autopay-pill autopay-enabled"
                                : "autopay-pill"
                            }
                          >
                            {bill.autopay ? "On" : "Off"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`bill-status-pill ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="table-amount">
                          {formatBillCurrency(bill.amount)}
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className={
                                bill.paid
                                  ? "icon-button paid-icon-button"
                                  : "icon-button"
                              }
                              onClick={() =>
                                handleTogglePaid(bill.id)
                              }
                              aria-label={
                                bill.paid
                                  ? `Mark ${bill.name} unpaid`
                                  : `Mark ${bill.name} paid`
                              }
                              title={
                                bill.paid
                                  ? "Mark unpaid"
                                  : "Mark paid"
                              }
                            >
                              <FiCheck />
                            </button>

                            <button
                              type="button"
                              className="icon-button"
                              onClick={() =>
                                openEditModal(bill)
                              }
                              aria-label={`Edit ${bill.name}`}
                            >
                              <FiEdit2 />
                            </button>

                            <button
                              type="button"
                              className="icon-button delete-icon-button"
                              onClick={() =>
                                handleDeleteBill(bill.id)
                              }
                              aria-label={`Delete ${bill.name}`}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="table-empty-state"
                      colSpan="8"
                    >
                      No bills match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="transaction-table-footer">
          Showing {filteredBills.length} of {bills.length} bills
        </div>
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeModal}
          role="presentation"
        >
          <div
            className="transaction-modal bill-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingId
                    ? "Update payment"
                    : "Schedule payment"}
                </p>

                <h2 id="bill-modal-title">
                  {editingId ? "Edit bill" : "Add bill"}
                </h2>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={closeModal}
                aria-label="Close bill form"
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleSubmit}
            >
              <div className="form-field form-field-full">
                <label htmlFor="bill-name">
                  Bill name
                </label>

                <input
                  id="bill-name"
                  name="name"
                  type="text"
                  placeholder="Example: Electric bill"
                  value={form.name}
                  onChange={handleInputChange}
                  autoFocus
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="bill-amount">
                  Amount
                </label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="bill-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="bill-due-date">
                  Due date
                </label>

                <input
                  id="bill-due-date"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="bill-category">
                  Category
                </label>

                <select
                  id="bill-category"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  disabled={saving}
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="bill-frequency">
                  Frequency
                </label>

                <select
                  id="bill-frequency"
                  name="frequency"
                  value={form.frequency}
                  onChange={handleInputChange}
                  disabled={saving}
                >
                  {billFrequencies.map((frequency) => (
                    <option
                      key={frequency}
                      value={frequency}
                    >
                      {frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field form-field-full">
                <div className="bill-toggle-grid">
                  <label className="bill-toggle-card">
                    <div>
                      <strong>Autopay</strong>

                      <span>
                        This bill is paid automatically.
                      </span>
                    </div>

                    <input
                      name="autopay"
                      type="checkbox"
                      checked={form.autopay}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </label>

                  <label className="bill-toggle-card">
                    <div>
                      <strong>Paid</strong>

                      <span>
                        Mark this bill as already paid.
                      </span>
                    </div>

                    <input
                      name="paid"
                      type="checkbox"
                      checked={form.paid}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="bill-notes">
                  Notes
                </label>

                <textarea
                  id="bill-notes"
                  name="notes"
                  rows="3"
                  placeholder="Optional payment details"
                  value={form.notes}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>

              <div className="modal-actions form-field-full">
                <button
                  className="secondary-button modal-cancel-button"
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
                      : "Save bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bills;