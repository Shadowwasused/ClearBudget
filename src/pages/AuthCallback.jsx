import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function AuthCallback() {
  const navigate = useNavigate();

  const [message, setMessage] = useState(
    "Confirming your ClearBudget account...",
  );

  useEffect(() => {
    let active = true;

    async function finishConfirmation() {
      try {
        const currentUrl = new URL(window.location.href);

        const code = currentUrl.searchParams.get("code");
        const tokenHash =
          currentUrl.searchParams.get("token_hash");
        const type =
          currentUrl.searchParams.get("type") || "signup";

        const errorDescription =
          currentUrl.searchParams.get(
            "error_description",
          );

        if (errorDescription) {
          throw new Error(
            decodeURIComponent(errorDescription),
          );
        }

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(
              code,
            );

          if (error) {
            throw error;
          }
        }

        if (!code && tokenHash) {
          const { error } =
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type,
            });

          if (error) {
            throw error;
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!active) {
          return;
        }

        if (session?.user) {
          setMessage(
            "Your email is confirmed. Opening ClearBudget...",
          );

          navigate("/beta-welcome", {
            replace: true,
          });

          return;
        }

        navigate("/login?confirmed=true", {
          replace: true,
        });
      } catch (error) {
        console.error(
          "Unable to complete email confirmation:",
          error,
        );

        if (!active) {
          return;
        }

        setMessage(
          error?.message ||
            "Your email may already be confirmed. Please sign in.",
        );

        window.setTimeout(() => {
          if (active) {
            navigate("/login?confirmed=true", {
              replace: true,
            });
          }
        }, 2500);
      }
    }

    finishConfirmation();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "min(460px, 100%)",
          padding: "32px",
          border: "1px solid #dbe3ee",
          borderRadius: "20px",
          background: "#ffffff",
          boxShadow:
            "0 18px 45px rgba(15, 23, 42, 0.12)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 0 12px",
            color: "#0f172a",
          }}
        >
          ClearBudget
        </h1>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      </div>
    </main>
  );
}

export default AuthCallback;