// src/app/AppShell.jsx
import React, { Suspense, startTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "semantic-ui-react";
import styles from "./AppShell.module.css";

export function PageSkeleton() {
  return (
    <div className={styles.pageSkeleton}>
      <div className={styles.skTitle} />
      <div className={styles.skCard} />
      <div className={styles.skLine} />
      <div className={styles.skLine} />
      <div className={styles.skLine} />
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  const navigate = useNavigate();
  const goHome = () => {
    // clear the boundary AND transition the navigation
    resetErrorBoundary();
    startTransition(() => {
      navigate("/", { replace: true });
    });
  };

  return (
    <div role="alert" className={styles.errorWrapper}>
      <div className={styles.errorBox}>
        <h2 className={styles.errorTitle}>Something went wrong.</h2>
        <pre className={styles.errorMessage}>{error.message}</pre>
        <div className={styles.buttonRow}>
          <Button primary size="large" onClick={goHome}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const location = useLocation();
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={[location.pathname]} // auto-reset on route change
    >
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
