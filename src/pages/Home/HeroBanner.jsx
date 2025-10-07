// HeroBanner.jsx
import React from "react";
import styles from "./HeroBanner.module.css";
import { useHeroBanner } from "../../hooks/useHeroBanner"; // your React Query hook

export default function HeroBanner() {
  const { data: url } = useHeroBanner();

  return (
    <div className={styles.heroShell}>
      {url ? (
        <img
          src={url}
          alt="Hero banner"
          className={styles.heroImg}
          width="1920"
          height="200" /* helps CLS in some browsers */
          loading="eager" /* it’s above the fold */
          fetchPriority="high"
          decoding="async"
        />
      ) : (
        <div
          className={styles.heroSkeleton}
          role="img"
          aria-label="Loading banner"
        />
      )}
    </div>
  );
}
