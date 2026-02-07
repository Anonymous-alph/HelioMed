import styles from './Card.module.css';

export default function Card({
  children,
  header,
  icon,
  actions,
  className = ''
}) {
  return (
    <div className={`${styles.card} ${className}`}>
      {(header || icon || actions) && (
        <div className={styles.cardHeader}>
          {icon && <div className={styles.cardIcon}>{icon}</div>}
          {header && <h3 className={styles.cardTitle}>{header}</h3>}
          {actions && <div className={styles.cardActions}>{actions}</div>}
        </div>
      )}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
}
