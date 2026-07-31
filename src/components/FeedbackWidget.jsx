import { useState } from "react";
import {
  FiCheckCircle,
  FiMessageSquare,
  FiSend,
  FiX,
} from "react-icons/fi";

import { createFeedback } from "../lib/feedbackApi";
import "./FeedbackWidget.css";

const defaultForm = {
  category: "bug",
  title: "",
  message: "",
};

function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  function closePanel() {
    if (sending) {
      return;
    }

    setOpen(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    const message = form.message.trim();

    setErrorMessage("");
    setSuccessMessage("");

    if (!title) {
      setErrorMessage("Please enter a short title.");
      return;
    }

    if (message.length < 10) {
      setErrorMessage(
        "Please include a little more detail.",
      );
      return;
    }

    try {
      setSending(true);

      await createFeedback({
        category: form.category,
        title,
        message,
        pageUrl: window.location.pathname,
        appVersion: "beta",
      });

      setForm(defaultForm);
      setSuccessMessage(
        "Thank you. Your feedback was submitted.",
      );
    } catch (error) {
      console.error(
        "Unable to submit feedback:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "Your feedback could not be submitted.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        className="feedback-launcher no-print"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open feedback form"
      >
        <FiMessageSquare />
        <span>Feedback</span>
      </button>

      {open && (
        <>
          <button
            className="feedback-overlay no-print"
            type="button"
            onClick={closePanel}
            aria-label="Close feedback panel"
          />

          <aside
            className="feedback-panel no-print"
            aria-labelledby="feedback-panel-title"
          >
            <div className="feedback-panel-header">
              <div>
                <p>ClearBudget Beta</p>
                <h2 id="feedback-panel-title">
                  Send feedback
                </h2>
              </div>

              <button
                type="button"
                onClick={closePanel}
                disabled={sending}
                aria-label="Close feedback panel"
              >
                <FiX />
              </button>
            </div>

            <p className="feedback-panel-intro">
              Report a bug, suggest a feature, or tell us
              what could be improved.
            </p>

            {successMessage ? (
              <div className="feedback-success-state">
                <FiCheckCircle />

                <h3>Feedback received</h3>

                <p>{successMessage}</p>

                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage("");
                    setForm(defaultForm);
                  }}
                >
                  Submit more feedback
                </button>
              </div>
            ) : (
              <form
                className="feedback-form"
                onSubmit={handleSubmit}
              >
                <label>
                  <span>Category</span>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    disabled={sending}
                  >
                    <option value="bug">
                      Bug report
                    </option>

                    <option value="feature">
                      Feature request
                    </option>

                    <option value="improvement">
                      Improvement
                    </option>

                    <option value="general">
                      General feedback
                    </option>
                  </select>
                </label>

                <label>
                  <span>Title</span>

                  <input
                    name="title"
                    type="text"
                    placeholder="Brief summary"
                    value={form.title}
                    onChange={handleChange}
                    disabled={sending}
                    maxLength={120}
                  />
                </label>

                <label>
                  <span>Details</span>

                  <textarea
                    name="message"
                    rows="8"
                    placeholder="Tell us what happened, what you expected, or what you would like to see."
                    value={form.message}
                    onChange={handleChange}
                    disabled={sending}
                  />
                </label>

                <div className="feedback-page-detail">
                  Current page:
                  <strong>
                    {window.location.pathname}
                  </strong>
                </div>

                {errorMessage && (
                  <div
                    className="feedback-error"
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  className="feedback-submit-button"
                  type="submit"
                  disabled={sending}
                >
                  <FiSend />

                  {sending
                    ? "Submitting..."
                    : "Submit feedback"}
                </button>
              </form>
            )}
          </aside>
        </>
      )}
    </>
  );
}

export default FeedbackWidget;