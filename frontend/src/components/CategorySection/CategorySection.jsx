import styles from './CategorySection.module.scss';

function CategorySection({
  title = 'Natural & Exact Sciences',
  actionText = 'Еще',
  onAction,
}) {
  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.title}>{title}</h2>
        <button
          type="button"
          className={styles.actionButton}
          onClick={onAction}
        >
          {actionText}
        </button>
      </div>
      <div className={styles.divider} />
    </section>
  );
}

export default CategorySection;
