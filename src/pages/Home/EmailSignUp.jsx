import React, { useState } from "react";
import Portal from "../../components/Portal/Portal";
import styles from "./EmailSignUp.module.css";

export default function SignupInsiderBar({
  onSubmit,
  labelText = "SIGN UP FOR OUR DAILY INSIDER",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState("idle");

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const isValid = isValidEmail(email);

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);
      if (onSubmit) await onSubmit(email);
      setEmail("");
      setStatus("success");
    } catch (err) {
      setStatus("error");
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const showToast = status === "success" || status === "error";

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <span className={styles.label}>{labelText}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          aria-invalid={touched && !isValid}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={!isValid || submitting}
          className={`${styles.button} ${
            status === "success" ? styles.success : ""
          } ${status === "error" ? styles.error : ""}`}
        >
          {submitting
            ? "Submitting…"
            : status === "success"
              ? "✓ Subscribed"
              : status === "error"
                ? "x Failed"
                : buttonText}
        </button>
      </form>

      {showToast && (
        <Portal>
          <div
            className={`${styles.toastOverlay} ${
              status === "success" ? styles.toastOverlaySuccess : styles.toastOverlayError
            }`}
            role="alert"
            aria-live="assertive"
          >
            <div className={styles.toastCard}>
              <strong>
                {status === "success" ? "Subscribed!" : "Subscription failed"}
              </strong>
              <p>
                {status === "success"
                  ? "Thanks for joining our insider list. Keep an eye on your inbox."
                  : "We couldn’t add that email. Please try again in a moment."}
              </p>
              <button
                type="button"
                className={styles.toastDismiss}
                onClick={() => setStatus("idle")}
              >
                Dismiss
              </button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
