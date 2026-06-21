import CategorySection from '../components/CategorySection/CategorySection.jsx';
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx';
import Button from '../components/Buttons/Button.jsx';
import styles from './CatPage.module.scss';

function CatPage({ category, projects = [], onBack, onProjectClick = () => {} }) {
  if (!category) {
    return (
      <section className={styles.empty}>
        <h1>Категория не найдена</h1>
        <Button type="button" variant="outline" onClick={onBack}>
          Вернуться
        </Button>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{category.title}</h1>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          Назад к списку
        </Button>
      </div>

      <CategorySection title={category.title} showAction={false} />
      <ProjectCards projects={projects} onProjectClick={onProjectClick} />
    </section>
  );
}

export default CatPage;
