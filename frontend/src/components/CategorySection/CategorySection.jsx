import Button from '../Buttons/Button';
import styles from './CategorySection.module.scss';

function CategorySection({
  title = '',
  actionText = 'Еще',
  actionHref,
  onAction,
  showAction = true,
}) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headingRow}>
          <h2 className={styles.title}>{title}</h2>
          {showAction && ( 
            <Button
              type="button"
              variant="outline"
              className={styles.actionButton}
              href={actionHref}
              onClick={onAction}
            >
              {actionText}
            </Button>
          )}
        </div>
        <div className={styles.divider} />
      </div>
    </section>
  );
}

export default CategorySection;
