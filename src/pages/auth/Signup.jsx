import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await signUp(email, password);

      if (signUpError) {
        throw signUpError;
      }

      if (data?.session) {
        navigate("/dashboard");
        return;
      }

      setMessage(
        "Your account was created. Check your email to confirm your account before signing in."
      );
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background-glow login-background-glow-left" />
      <div className="login-background-glow login-background-glow-right" />

      <div className="login-wave login-wave-left">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="login-wave login-wave-right">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <section className="login-card signup-card">
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">
            <span className="login-logo-bar login-logo-bar-one" />
            <span className="login-logo-bar login-logo-bar-two" />
            <span className="login-logo-bar login-logo-bar-three" />
          </div>

          <div>
            <h1>
              Clear<span>Budget</span>
            </h1>
            <p>Take control. Build your future.</p>
          </div>
        </div>

        <div className="login-divider">
          <span />

          <div className="login-shield" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 21a7 7 0 0 1 14 0" />
              <path d="M19 8v6" />
              <path d="M16 11h6" />
            </svg>
          </div>

          <span />
        </div>

        <header className="login-heading">
          <h2>Create your account</h2>
          <p>Start building a clearer financial future</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="login-field">
            <span className="login-field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <button
              className="login-password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="m3 3 18 18" />
                  <path d="M10.6 6.1A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.7" />
                  <path d="M6.4 6.4C3.5 8.2 2 12 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.8" />
                </svg>
              )}
            </button>
          </label>

          <label className="login-field">
            <span className="login-field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5 9.5 17 19 7.5" />
              </svg>
            </span>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <div className="signup-password-note">
            Use at least 6 characters for your password.
          </div>

          <label className="signup-terms">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(event) => setAgreeToTerms(event.target.checked)}
            />

            <span>
              I agree to the <a href="#terms">Terms of Service</a> and{" "}
              <a href="#privacy">Privacy Policy</a>
            </span>
          </label>

          {error && <div className="login-alert login-alert-error">{error}</div>}

          {message && (
            <div className="login-alert login-alert-success">{message}</div>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? "Creating account..." : "Create Account"}</span>

            {!loading && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m14 7 5 5-5 5" />
              </svg>
            )}
          </button>
        </form>

        <div className="login-create-account">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>

        <footer className="login-trust">
          <div className="login-trust-item">
            <div className="login-trust-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 3 19 6v5c0 4.6-2.9 8.7-7 10-4.1-1.3-7-5.4-7-10V6l7-3Z" />
                <path d="m9.3 12 1.8 1.8 3.8-4" />
              </svg>
            </div>

            <div>
              <strong>Secure access</strong>
              <span>Your account is protected</span>
            </div>
          </div>

          <div className="login-trust-item">
            <div className="login-trust-icon">
              <svg viewBox="0 0 24 24">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>

            <div>
              <strong>Private by design</strong>
              <span>Your data belongs to you</span>
            </div>
          </div>

          <div className="login-trust-item">
            <div className="login-trust-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
              </svg>
            </div>

            <div>
              <strong>Clear and reliable</strong>
              <span>Built for peace of mind</span>
            </div>
          </div>
        </footer>
      </section>

      <p className="login-copyright">
        © {new Date().getFullYear()} ClearBudget. Your finances, made clearer.
      </p>
    </main>
  );
}