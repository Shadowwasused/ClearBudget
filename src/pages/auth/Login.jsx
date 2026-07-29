import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signIn({ email, password });


      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    try {
     await resetPassword(email);

      setMessage("Password reset instructions were sent to your email.");
    } catch (err) {
      setError(err.message || "Unable to send the password reset email.");
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

      <section className="login-card">
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
              <path d="M12 3 19 6v5c0 4.6-2.9 8.7-7 10-4.1-1.3-7-5.4-7-10V6l7-3Z" />
              <path d="m9.3 12 1.8 1.8 3.8-4" />
            </svg>
          </div>
          <span />
        </div>

        <header className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your account</p>
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
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
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

          <div className="login-options">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button
              className="login-forgot"
              type="button"
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </button>
          </div>

          {error && <div className="login-alert login-alert-error">{error}</div>}

          {message && (
            <div className="login-alert login-alert-success">{message}</div>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>

            {!loading && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m14 7 5 5-5 5" />
              </svg>
            )}
          </button>
        </form>

        <div className="login-create-account">
          <span>Don&apos;t have an account?</span>
          <Link to="/signup">Create one</Link>
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