import { useEffect, useMemo, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";

import {
  formatBillCurrency,
  getBillStatus,
  loadBills,
  subscribeToBills,
} from "../lib/bills";

import {
  formatCurrency,
  loadTransactions,
  subscribeToTransactions,
} from "../lib/transactions";

function Calendar() {
  const [transactions, setTransactions] = useState(
    loadTransactions,
  );

  const [bills, setBills] = useState(loadBills);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );
  });

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(new Date()),
  );

  useEffect(() => {
    const unsubscribeTransactions =
      subscribeToTransactions(setTransactions);

    const unsubscribeBills = subscribeToBills(setBills);

    return () => {
      unsubscribeTransactions();
      unsubscribeBills();
    };
  }, []);

  const calendarDays = useMemo(() => {
    return buildCalendarDays(
      visibleMonth,
      transactions,
      bills,
    );
  }, [visibleMonth, transactions, bills]);

  const selectedDayData = useMemo(() => {
    return getDayData(
      selectedDate,
      transactions,
      bills,
    );
  }, [selectedDate, transactions, bills]);

  const monthSummary = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const monthlyTransactions = transactions.filter(
      (transaction) => {
        const date = parseDate(transaction.date);

        return (
          date.getFullYear() === year &&
          date.getMonth() === month
        );
      },
    );

    const monthlyBills = bills.filter((bill) => {
      const date = parseDate(bill.dueDate);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    });

    const income = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "income",
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0,
      );

    const expenses = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense",
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0,
      );

    const unpaidBills = monthlyBills
      .filter((bill) => !bill.paid)
      .reduce(
        (total, bill) =>
          total + Number(bill.amount || 0),
        0,
      );

    return {
      income,
      expenses,
      unpaidBills,
      net: income - expenses,
    };
  }, [visibleMonth, transactions, bills]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  function goToPreviousMonth() {
    const previousMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1,
    );

    setVisibleMonth(previousMonth);
    setSelectedDate(formatDateKey(previousMonth));
  }

  function goToNextMonth() {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );

    setVisibleMonth(nextMonth);
    setSelectedDate(formatDateKey(nextMonth));
  }

  function goToToday() {
    const today = new Date();

    setVisibleMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

    setSelectedDate(formatDateKey(today));
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            Monthly financial schedule
          </p>

          <h1>Calendar</h1>

          <p className="page-description">
            Review bills, income, and expenses by date.
          </p>
        </div>

        <div className="calendar-heading-actions no-print">
          <button
            className="secondary-button"
            type="button"
            onClick={() => window.print()}
          >
            Print Calendar
          </button>

          <button
            className="secondary-button calendar-today-button"
            type="button"
            onClick={goToToday}
          >
            Today
          </button>
        </div>
      </div>

      <section className="print-only calendar-print-summary">
        <div className="print-header">
          <div className="print-brand">
            <div className="print-logo">C</div>

            <div>
              <h1>ClearBudget Financial Calendar</h1>
              <p>{monthLabel}</p>
            </div>
          </div>

          <p>
            Printed: {new Date().toLocaleDateString("en-US")}
          </p>
        </div>

        <div className="print-summary-totals">
          <div>
            <span>Income</span>
            <strong>
              {formatCurrency(monthSummary.income)}
            </strong>
          </div>

          <div>
            <span>Expenses</span>
            <strong>
              {formatCurrency(monthSummary.expenses)}
            </strong>
          </div>

          <div>
            <span>Unpaid Bills</span>
            <strong>
              {formatBillCurrency(monthSummary.unpaidBills)}
            </strong>
          </div>

          <div>
            <span>Net Activity</span>
            <strong>
              {formatCurrency(monthSummary.net)}
            </strong>
          </div>
        </div>

        <div className="print-calendar-weekdays">
          <span>Sunday</span>
          <span>Monday</span>
          <span>Tuesday</span>
          <span>Wednesday</span>
          <span>Thursday</span>
          <span>Friday</span>
          <span>Saturday</span>
        </div>

        <div className="print-calendar-grid">
          {calendarDays.map((day) => (
            <div
              key={day.dateKey}
              className={[
                "print-calendar-day",
                day.isCurrentMonth
                  ? ""
                  : "print-calendar-day-muted",
                day.isToday
                  ? "print-calendar-day-today"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <strong className="print-calendar-day-number">
                {day.dayNumber}
              </strong>

              <div className="print-calendar-events">
                {day.incomeTotal > 0 && (
                  <div className="print-calendar-event print-calendar-income">
                    <span>Income</span>
                    <strong>
                      +{formatCurrency(day.incomeTotal)}
                    </strong>
                  </div>
                )}

                {day.expenseTotal > 0 && (
                  <div className="print-calendar-event print-calendar-expense">
                    <span>Expenses</span>
                    <strong>
                      -{formatCurrency(day.expenseTotal)}
                    </strong>
                  </div>
                )}

                {day.billCount > 0 && (
                  <div className="print-calendar-event print-calendar-bill">
                    <span>
                      {day.billCount === 1
                        ? "1 bill due"
                        : `${day.billCount} bills due`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="calendar-summary-grid">
        <CalendarSummaryCard
          label="Income"
          value={formatCurrency(monthSummary.income)}
          icon={<FiArrowUpRight />}
          valueClass="money-positive"
        />

        <CalendarSummaryCard
          label="Expenses"
          value={formatCurrency(monthSummary.expenses)}
          icon={<FiArrowDownRight />}
          valueClass="money-negative"
        />

        <CalendarSummaryCard
          label="Unpaid bills"
          value={formatBillCurrency(
            monthSummary.unpaidBills,
          )}
          icon={<FiClock />}
          valueClass="money-negative"
        />

        <CalendarSummaryCard
          label="Net activity"
          value={formatCurrency(monthSummary.net)}
          icon={<FiDollarSign />}
          valueClass={
            monthSummary.net >= 0
              ? "money-positive"
              : "money-negative"
          }
        />
      </div>

      <div className="calendar-layout">
        <section className="content-card calendar-card">
          <div className="calendar-header">
            <button
              className="icon-button"
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <FiArrowLeft />
            </button>

            <h2>{monthLabel}</h2>

            <button
              className="icon-button"
              type="button"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <FiArrowRight />
            </button>
          </div>

          <div className="calendar-weekdays">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <CalendarDay
                key={day.dateKey}
                day={day}
                selected={
                  day.dateKey === selectedDate
                }
                onSelect={setSelectedDate}
              />
            ))}
          </div>
        </section>

        <section className="content-card calendar-details-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Selected date
              </p>

              <h2>
                {formatSelectedDate(selectedDate)}
              </h2>
            </div>

            <FiCalendar className="calendar-details-icon" />
          </div>

          <div className="calendar-day-totals">
            <div>
              <span>Income</span>

              <strong className="money-positive">
                {formatCurrency(
                  selectedDayData.incomeTotal,
                )}
              </strong>
            </div>

            <div>
              <span>Expenses</span>

              <strong className="money-negative">
                {formatCurrency(
                  selectedDayData.expenseTotal,
                )}
              </strong>
            </div>

            <div>
              <span>Bills due</span>

              <strong>
                {formatBillCurrency(
                  selectedDayData.billTotal,
                )}
              </strong>
            </div>
          </div>

          <div className="calendar-event-section">
            <h3>Bills</h3>

            {selectedDayData.bills.length > 0 ? (
              <div className="calendar-event-list">
                {selectedDayData.bills.map((bill) => (
                  <BillEvent
                    key={bill.id}
                    bill={bill}
                  />
                ))}
              </div>
            ) : (
              <p className="calendar-no-events">
                No bills are due on this date.
              </p>
            )}
          </div>

          <div className="calendar-event-section">
            <h3>Transactions</h3>

            {selectedDayData.transactions.length > 0 ? (
              <div className="calendar-event-list">
                {selectedDayData.transactions.map(
                  (transaction) => (
                    <TransactionEvent
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ),
                )}
              </div>
            ) : (
              <p className="calendar-no-events">
                No transactions were recorded on this date.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function CalendarSummaryCard({
  label,
  value,
  icon,
  valueClass,
}) {
  return (
    <section className="summary-card">
      <div className="calendar-summary-heading">
        <p>{label}</p>
        <span>{icon}</span>
      </div>

      <h2 className={valueClass}>{value}</h2>

      <small>Visible month</small>
    </section>
  );
}

function CalendarDay({
  day,
  selected,
  onSelect,
}) {
  return (
    <button
      className={[
        "calendar-day",
        day.isCurrentMonth
          ? ""
          : "calendar-day-outside",
        day.isToday ? "calendar-day-today" : "",
        selected ? "calendar-day-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      onClick={() => onSelect(day.dateKey)}
    >
      <span className="calendar-day-number">
        {day.dayNumber}
      </span>

      <div className="calendar-day-markers">
        {day.incomeTotal > 0 && (
          <span className="calendar-marker calendar-income-marker">
            +{compactCurrency(day.incomeTotal)}
          </span>
        )}

        {day.expenseTotal > 0 && (
          <span className="calendar-marker calendar-expense-marker">
            -{compactCurrency(day.expenseTotal)}
          </span>
        )}

        {day.billCount > 0 && (
          <span className="calendar-marker calendar-bill-marker">
            {day.billCount}{" "}
            {day.billCount === 1 ? "bill" : "bills"}
          </span>
        )}
      </div>
    </button>
  );
}

function BillEvent({ bill }) {
  const status = getBillStatus(bill);

  return (
    <div className="calendar-event-item">
      <div className="calendar-event-icon calendar-bill-icon">
        {bill.paid ? <FiCheckCircle /> : <FiClock />}
      </div>

      <div className="calendar-event-info">
        <strong>{bill.name}</strong>

        <span>
          {bill.category || "Bill"}
          {bill.autopay ? " · Autopay" : ""}
        </span>
      </div>

      <div className="calendar-event-value">
        <strong>
          {formatBillCurrency(bill.amount)}
        </strong>

        <span className={status.className}>
          {status.label}
        </span>
      </div>
    </div>
  );
}

function TransactionEvent({ transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <div className="calendar-event-item">
      <div
        className={`calendar-event-icon ${
          isIncome
            ? "calendar-income-icon"
            : "calendar-expense-icon"
        }`}
      >
        {isIncome ? (
          <FiArrowUpRight />
        ) : (
          <FiArrowDownRight />
        )}
      </div>

      <div className="calendar-event-info">
        <strong>{transaction.description}</strong>

        <span>
          {transaction.category}
          {transaction.account
            ? ` · ${transaction.account}`
            : ""}
        </span>
      </div>

      <strong
        className={
          isIncome
            ? "calendar-transaction-income"
            : "money-negative"
        }
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </strong>
    </div>
  );
}

function buildCalendarDays(
  visibleMonth,
  transactions,
  bills,
) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const calendarStart = new Date(
    year,
    month,
    1 - firstDay.getDay(),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      calendarStart.getFullYear(),
      calendarStart.getMonth(),
      calendarStart.getDate() + index,
    );

    const dateKey = formatDateKey(date);

    const dayTransactions = transactions.filter(
      (transaction) =>
        transaction.date === dateKey,
    );

    const dayBills = bills.filter(
      (bill) => bill.dueDate === dateKey,
    );

    const incomeTotal = dayTransactions
      .filter(
        (transaction) =>
          transaction.type === "income",
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0,
      );

    const expenseTotal = dayTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense",
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0,
      );

    return {
      dateKey,
      dayNumber: date.getDate(),
      incomeTotal,
      expenseTotal,
      billCount: dayBills.length,
      isCurrentMonth: date.getMonth() === month,
      isToday:
        dateKey === formatDateKey(new Date()),
    };
  });
}

function getDayData(
  dateKey,
  transactions,
  bills,
) {
  const dayTransactions = transactions.filter(
    (transaction) =>
      transaction.date === dateKey,
  );

  const dayBills = bills.filter(
    (bill) => bill.dueDate === dateKey,
  );

  const incomeTotal = dayTransactions
    .filter(
      (transaction) =>
        transaction.type === "income",
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0,
    );

  const expenseTotal = dayTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense",
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0,
    );

  const billTotal = dayBills.reduce(
    (total, bill) =>
      total + Number(bill.amount || 0),
    0,
  );

  return {
    transactions: dayTransactions,
    bills: dayBills,
    incomeTotal,
    expenseTotal,
    billTotal,
  };
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function formatDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function formatSelectedDate(dateKey) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseDate(dateKey));
}

function compactCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount || 0));
}

export default Calendar;