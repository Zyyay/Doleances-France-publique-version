import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.wrap} role="status" aria-label="Chargement">
      <div className={styles.spinner} />
    </div>
  );
}
