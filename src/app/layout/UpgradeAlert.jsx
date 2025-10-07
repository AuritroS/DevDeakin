import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import styles from "./UpgradeAlert.module.css";

export default function UpgradeAlert() {
  const { premium, loading } = useAuth();
  const [visible, setVisible] = useState(true);
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    const host =
      document.getElementById("upgrade-alert-portal") ??
      document.getElementById("portal-root");

    setPortalRoot(host);
  }, []);

  if (loading || premium || !visible || !portalRoot) return null;

  return createPortal(
    <div className={styles.alert}>
      <span className={styles.message}>
        Unlock premium features like theme switcher, badge, and early access.
      </span>

      {/* Upgrade button only */}
      <div className={styles.actions}>
        <Link to="/plans" className={styles.cta}>
          Upgrade
        </Link>
      </div>

      {/* Dismiss button moved OUTSIDE of actions */}
      <button
        onClick={() => setVisible(false)}
        className={styles.dismiss}
        aria-label="Dismiss upgrade alert"
      >
        ✕
      </button>
    </div>,
    portalRoot
  );
}
