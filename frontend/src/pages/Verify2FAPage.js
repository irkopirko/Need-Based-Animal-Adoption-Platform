import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./LoginPage.css";
import "./Verify2FAPage.css";
import { getApiBaseUrl, getHomePathByRole, normalizeRole } from "../utils/auth";

function Verify2FAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...codeDigits];
    nextDigits[index] = digit;
    setCodeDigits(nextDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!pasted) {
      return;
    }

    const filled = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i += 1) {
      filled[i] = pasted[i];
    }

    setCodeDigits(filled);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Session expired. Please register again.");
      return;
    }

    const code = codeDigits.join("");
    if (code.length !== 6) {
      setMessage("Please enter the full 6-digit verification code.");
      return;
    }

    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Verification failed.");
        return;
      }

      const resolvedRole = normalizeRole(data.role);
      if (!resolvedRole) {
        setMessage("User role could not be determined. Please try again.");
        return;
      }

      localStorage.setItem(
        "paviaUser",
        JSON.stringify({
          email,
          role: resolvedRole
        })
      );

      window.alert("Account created successfully.");
      navigate(getHomePathByRole(resolvedRole), { replace: true });
    } catch (error) {
      console.error(error);
      setMessage(
        `Could not connect to backend at ${apiBaseUrl}. Check backend status/CORS/API URL.`
      );
    }
  };

  const handleResendCode = async () => {
    if (!email || resendCooldown > 0) {
      return;
    }

    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not resend verification code.");
        return;
      }

      setMessage("A new verification code has been sent to your email.");
      setResendCooldown(30);
      setCodeDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error(error);
      setMessage(
        `Could not connect to backend at ${apiBaseUrl}. Check backend status/CORS/API URL.`
      );
    }
  };

  return (
    <div className="login-page verify2fa-page">
      <Navbar />

      <main className="login-main">
        <div className="login-card">
          <div className="login-left">
            <div className="login-left-overlay"></div>
            <div className="login-left-text">
              <p className="login-left-tag">Email Verification</p>
              <h2>Verify your account</h2>
              <p className="login-left-desc">
                Enter the 6-digit code sent to your email to create your account.
              </p>
            </div>
          </div>

          <div className="login-right">
            <div className="login-box">
              <p className="login-form-tag">Account Security</p>
              <h1>Enter Verification Code</h1>
              <p className="login-subtitle">
                {email ? `Code sent to ${email}` : "Please go back and register again."}
              </p>

              {message !== "" && <div className="login-message">{message}</div>}

              <form onSubmit={handleVerify}>
                <label className="login-label">
                  Verification Code
                  <div className="verify2fa-code-grid" onPaste={handlePaste}>
                    {codeDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          inputRefs.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="verify2fa-digit-input"
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </label>

                <button type="submit" className="login-submit-btn">
                  Verify Email
                </button>
              </form>

              <p className="verify2fa-resend-text">
                Didn&apos;t receive the email?{" "}
                <button
                  type="button"
                  className="verify2fa-resend-link"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : "Resend email"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Verify2FAPage;