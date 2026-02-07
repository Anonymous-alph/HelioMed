import styles from './Button.module.css';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
  className = ''
}) {
  const buttonClass = `${styles.button} ${styles[variant]} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className={styles.spinner}></span>
      ) : (
        children
      )}
    </button>
  );
}
